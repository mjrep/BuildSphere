const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { applyProjectVisibility } = require('../utils/visibility');
const NotificationService = require('../services/NotificationService');

// Configure multer for single image upload
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

class TaskProgressLogController {

  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async index(req, res) {
    try {
      const supabase = TaskProgressLogController.getSupabaseWithAuth(req);
      const projectId = parseInt(req.params.project);
      const taskId = req.query.task_id;

      // 1. Check Visibility first
      let projectQuery = supabase.from('projects').select('id').eq('id', projectId);
      projectQuery = applyProjectVisibility(projectQuery, req.user);
      const { data: isVisible } = await projectQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized. You do not have access to this project.' });
      }

      // 2. Fetch logs with joined data
      let query = supabase
        .from('task_progress_logs')
        .select(`
          *,
          creator:users!created_by(id, first_name, last_name),
          task:tasks!task_id(id, title),
          milestone:project_milestones!milestone_id(
            id, 
            milestone_name, 
            current_quantity, 
            target_quantity, 
            unit_of_measure,
            project_id
          )
        `);

      // Filter by project_id if it exists in the milestone relation
      if (projectId) {
        // We filter by checking if any of the phases/milestones of this project match
        query = query.eq('milestone.project_id', projectId);
      }

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Filter out any logs that might come from null milestones after the project_id filter
      // (PostgREST returns all logs but with null milestone if filtered this way unless it's an inner join)
      // Alternatively, we use inner join !inner if available, but for simplicity we filter here
      const validLogs = logs.filter(l => l.milestone && l.milestone.project_id === projectId);

      res.json({ data: validLogs.map(val => TaskProgressLogController.formatLog(val)) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching progress logs', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      const supabase = TaskProgressLogController.getSupabaseWithAuth(req);
      const user = req.user;
      const { task_id, quantity_accomplished, remarks, work_date, shift } = req.body;
      const file = req.file;

      if (!task_id || !quantity_accomplished || quantity_accomplished < 1) {
        return res.status(422).json({ message: 'Valid task_id and quantity_accomplished are required.' });
      }

      // 1. Resolve parent entities
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*, milestone:project_milestones!inner(*)')
        .eq('id', task_id)
        .single();

      if (taskError || !task || !task.milestone) {
        return res.status(422).json({ message: 'Task or milestone not found.' });
      }

      const milestone = task.milestone;

      if (!milestone.has_quantity) {
        return res.status(422).json({ message: 'The parent milestone does not support quantity tracking.' });
      }

      const remaining = milestone.target_quantity - milestone.current_quantity;
      if (parseInt(quantity_accomplished) > remaining) {
        return res.status(422).json({
          message: `Quantity exceeds remaining target. Only ${remaining} left.`,
          remaining
        });
      }

      // 2. Upload file if exists
      let imagePath = null;
      if (file) {
        const bucket = process.env.SUPABASE_BUCKET_PROGRESS || 'site-progress';
        const path = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${file.originalname}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;
        imagePath = path;
      }

      // 3. Create log
      const { data: log, error: logError } = await supabase
        .from('task_progress_logs')
        .insert([{
          task_id,
          milestone_id: milestone.id,
          created_by: user.id,
          quantity_accomplished: parseInt(quantity_accomplished),
          evidence_image_path: imagePath,
          remarks: remarks || null,
          ai_verification_status: 'for_checking',
          work_date: work_date || new Date().toISOString().split('T')[0],
          shift: shift || 'Morning'
        }])
        .select(`
          *,
          creator:users!created_by(id, first_name, last_name),
          task:tasks(id, title),
          milestone:project_milestones(id, milestone_name, current_quantity, target_quantity, unit_of_measure)
        `)
        .single();

      if (logError) throw logError;

      // --- Notification Trigger: Mentions & Site Update ---
      try {
        const { data: projectData } = await supabase
          .from('projects')
          .select('project_name, project_coordinator_id')
          .eq('id', milestone.project_id)
          .single();

        // 1. Mentions
        const { mentioned_user_ids } = req.body;
        if (mentioned_user_ids && Array.isArray(mentioned_user_ids)) {
          for (const mentionedId of mentioned_user_ids) {
            await NotificationService.createNotification(
              mentionedId,
              'You were mentioned',
              `${user.first_name} ${user.last_name} mentioned you in a site update on ${task?.title || 'Task'}.`,
              'info',
              `/projects/${milestone.project_id}/progress-logs`
            );
          }
        }

        // 2. Site Update Alert (to Project Coordinator)
        if (projectData?.project_coordinator_id) {
          await NotificationService.createNotification(
            projectData.project_coordinator_id,
            'New Site Update',
            `A new site update has been posted for ${projectData.project_name} and is ready for review.`,
            'info',
            `/projects/${milestone.project_id}/progress-logs`
          );
        }
      } catch (notifErr) {
        console.error('Site Update Notification Error:', notifErr);
      }

      // 4. Reconcile
      await TaskProgressLogController.reconcileProgress(supabase, task_id, milestone.id);

      res.status(201).json({
        message: 'Progress log saved.',
        data: TaskProgressLogController.formatLog(log)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error saving progress log', error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const supabase = TaskProgressLogController.getSupabaseWithAuth(req);
      const user = req.user;
      const { id } = req.params;
      const { quantity_accomplished, ai_verification_status } = req.body;

      // Ensure access
      const { data: log, error: fetchError } = await supabase
        .from('task_progress_logs')
        .select('*, task:tasks(project:projects(project_in_charge_id))')
        .eq('id', id)
        .single();

      if (fetchError || !log) throw fetchError || new Error('Log not found.');

      const inChargeId = log.task?.project?.project_in_charge_id;
      const role = (user.role || '').toLowerCase().replace(' ', '_');
      
      const isAuthorized = inChargeId === user.id || ['ceo', 'coo', 'admin'].includes(role);
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized. Only the Project in Charge or Executives can verify updates.' });
      }

      const updates = {};
      if (quantity_accomplished !== undefined) updates.quantity_accomplished = quantity_accomplished;
      if (ai_verification_status) updates.ai_verification_status = ai_verification_status;

      const { data: updatedLog, error: updateError } = await supabase
        .from('task_progress_logs')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          creator:users!created_by(id, first_name, last_name),
          task:tasks(id, title),
          milestone:project_milestones(id, milestone_name, current_quantity, target_quantity, unit_of_measure)
        `)
        .single();

      if (updateError) throw updateError;

      // --- AI Vision Trigger (Phase 2) ---
      if (ai_verification_status === 'verified') {
        try {
          const { data: project } = await supabase
            .from('projects')
            .select('id, project_in_charge_id')
            .eq('id', log.milestone?.project_id || 0)
            .single();

          if (project?.project_in_charge_id) {
            await NotificationService.createNotification(
              project.project_in_charge_id,
              'AI Vision Update',
              `AI Vision successfully counted and logged installed glass panels for ${log.task?.title || 'Task'}.`,
              'success',
              `/tasks/${log.task_id}`
            );
          }
        } catch (notifErr) {
          console.error('AI Vision Notification Error:', notifErr);
        }
      }

      // Reconcile
      await TaskProgressLogController.reconcileProgress(supabase, log.task_id, log.milestone_id);

      res.json({
        message: 'Progress log updated.',
        data: TaskProgressLogController.formatLog(updatedLog)
      });
    } catch (err) {
      console.error(err);
      const status = err.message.includes('Unauthorized') ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }

  static async reconcileProgress(supabase, taskId, milestoneId) {
    // 1. Calculate milestone progress sum
    const { data: logs } = await supabase
      .from('task_progress_logs')
      .select('quantity_accomplished')
      .eq('milestone_id', milestoneId);

    const totalMilestone = (logs || []).reduce((sum, log) => sum + parseInt(log.quantity_accomplished), 0);

    // Update milestone
    const { data: milestone } = await supabase
      .from('project_milestones')
      .select('target_quantity')
      .eq('id', milestoneId)
      .single();

    if (milestone) {
      await supabase
        .from('project_milestones')
        .update({ current_quantity: Math.min(totalMilestone, milestone.target_quantity) })
        .eq('id', milestoneId);
    }

    // 2. React to Task progress
    const { data: taskLogs } = await supabase
      .from('task_progress_logs')
      .select('quantity_accomplished')
      .eq('task_id', taskId);

    const taskProgress = (taskLogs || []).reduce((sum, log) => sum + parseInt(log.quantity_accomplished), 0);
    const isTaskDone = milestone && taskProgress >= milestone.target_quantity;

    const { data: task } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', taskId)
      .single();

    if (task) {
      let newStatus = task.status;
      if (task.status === 'completed' && !isTaskDone) newStatus = 'in_progress';
      else if (task.status !== 'completed') {
        newStatus = isTaskDone ? 'in_review' : (taskProgress > 0 ? 'in_progress' : 'todo');
      }

      if (newStatus !== task.status) {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      }
    }

    // --- Notification Triggers: Completion Rollups ---
    try {
      // 1. Milestone 100%
      const { data: updatedMilestone } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('id', milestoneId)
        .single();
      
      if (updatedMilestone && updatedMilestone.current_quantity >= updatedMilestone.target_quantity) {
        // Send to Accounting
        const { data: accts } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'Accounting');
        
        if (accts) {
          for (const acct of accts) {
            await NotificationService.createNotification(
              acct.id,
              'Milestone Completed',
              `Milestone '${updatedMilestone.milestone_name}' is complete. Ready for accounting review.`,
              'success',
              `/projects/${updatedMilestone.project_id}/milestones`
            );
          }
        }

        // 2. Project 100%
        const MilestoneService = require('../services/MilestoneService');
        const progressData = await MilestoneService.getProjectMilestonesProgress(updatedMilestone.project_id);
        
        if (progressData.project_progress >= 100) {
          const { data: project } = await supabase
            .from('projects')
            .select('project_name')
            .eq('id', updatedMilestone.project_id)
            .single();

          const { data: stakeholders } = await supabase
            .from('users')
            .select('id')
            .in('role', ['CEO', 'COO', 'Accounting']);
          
          if (stakeholders) {
            for (const person of stakeholders) {
              await NotificationService.createNotification(
                person.id,
                'Project Completed',
                `Project '${project?.project_name || 'Project'}' has reached 100% completion.`,
                'success',
                `/projects/${updatedMilestone.project_id}`
              );
            }
          }
        }
      }
    } catch (notifErr) {
      console.error('Completion Rollup Notification Error:', notifErr);
    }
  }

  static formatLog(log) {
    let imageUrl = null;
    if (log.evidence_image_path) {
      if (log.evidence_image_path.startsWith('http')) {
        imageUrl = log.evidence_image_path;
      } else {
        const bucket = process.env.SUPABASE_BUCKET_PROGRESS || 'site-progress';
        imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${log.evidence_image_path.replace(/^\/+/, '')}`;
      }
    }

    return {
      id: log.id,
      task_id: log.task_id,
      milestone_id: log.milestone_id,
      task: log.task ? { id: log.task.id, title: log.task.title } : null,
      quantity_accomplished: log.quantity_accomplished,
      evidence_image_url: imageUrl,
      remarks: log.remarks,
      ai_verification_status: log.ai_verification_status,
      milestone: log.milestone ? {
        id: log.milestone.id,
        name: log.milestone.milestone_name,
        current_quantity: log.milestone.current_quantity,
        target_quantity: log.milestone.target_quantity,
        unit_of_measure: log.milestone.unit_of_measure
      } : null,
      created_by: log.creator ? {
        id: log.creator.id,
        name: `${log.creator.first_name} ${log.creator.last_name}`
      } : null,
      work_date: log.work_date ? log.work_date.split('T')[0] : null,
      shift: log.shift,
      created_at: log.created_at
    };
  }
}

module.exports = {
  TaskProgressLogController,
  progressUploadMiddleware: upload.single('evidence_image')
};
