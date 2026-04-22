const { createClient } = require('@supabase/supabase-js');
const TaskQueryService = require('../services/TaskQueryService');

class TaskController {
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async index(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      
      let query = supabase.from('tasks');
      query = TaskQueryService.applyBaseQuery(query, req.user);
      query = TaskQueryService.applyFilters(query, req.query);
      query = TaskQueryService.applySort(query, req.query.sort);

      const { data: tasks, error, count } = await query;
      if (error) throw error;

      // Format tasks to camelCase mimicking Laravel Resource
      const formattedTasks = tasks.map(task => TaskController.formatTask(task));

      const perPage = parseInt(req.query.per_page) || 20;

      res.json({
        data: formattedTasks,
        meta: {
          current_page: 1, // Full pagination handled in-memory or mapped to Supabase ranges if needed
          last_page: Math.ceil((count || formattedTasks.length) / perPage) || 1,
          per_page: perPage,
          total: count || formattedTasks.length
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching tasks', error: err.message });
    }
  }

  static async meta(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      
      // Projects
      // Filtering visible projects could reuse logic from Dashboard, but simplistic select here:
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, project_name, project_code')
        .order('project_name', { ascending: true });

      const projects = (projectsData || []).map(p => ({
        id: p.id,
        name: p.project_name
      }));

      // Users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .order('first_name', { ascending: true });

      const users = (usersData || []).map(u => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role
      }));

      res.json({
        projects,
        users,
        priorities: ['low', 'medium', 'high', 'urgent'],
        statuses: ['todo', 'in_progress', 'in_review', 'completed']
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching meta definitions', error: err.message });
    }
  }

  static async show(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      const { task: id } = req.params;

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, project_name),
          phase:project_phases(id, phase_key),
          milestone:project_milestones(id, milestone_name, has_quantity, target_quantity, current_quantity, unit_of_measure),
          assignedBy:users!assigned_by(id, first_name, last_name),
          assignedTo:users!assigned_to(id, first_name, last_name),
          creator:users!created_by(id, first_name, last_name),
          updater:users!updated_by(id, first_name, last_name),
          comments:task_comments(id, comment, created_at, user:users(id, first_name, last_name)),
          attachments:task_attachments(id, file_name, file_type, file_size, created_at, uploader:users(id, first_name, last_name)),
          progress_logs:task_progress_logs(id, quantity_accomplished, evidence_image_path, remarks, ai_verification_status, created_at, creator:users!created_by(id, first_name, last_name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      res.json(TaskController.formatTaskDetail(data));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching task detail', error: err.message });
    }
  }

  static async store(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      const user = req.user;
      
      const payload = {
        project_id: req.body.project_id,
        phase_id: req.body.phase_id,
        milestone_id: req.body.milestone_id,
        title: req.body.title,
        description: req.body.description,
        assigned_by: user.id,
        assigned_to: req.body.assigned_to,
        priority: req.body.priority || 'medium',
        status: req.body.status || 'todo',
        department_role: req.body.department_role,
        visibility_scope: req.body.visibility_scope || 'public',
        start_date: req.body.start_date,
        due_date: req.body.due_date,
        created_by: user.id
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(TaskController.formatTask(task));
    } catch (err) {
      console.error(err);
      res.status(422).json({ message: 'Error creating task', error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      const user = req.user;
      const { task: id } = req.params;

      const payload = { ...req.body, updated_by: user.id, updated_at: new Date().toISOString() };
      delete payload.attachments; // Attachments handled via dedicated controller/routes if active

      const { data: task, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(TaskController.formatTask(task));
    } catch (err) {
      console.error(err);
      res.status(422).json({ message: 'Error updating task', error: err.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      const { task: id } = req.params;
      const { status } = req.body;

      const { data, error } = await supabase
        .from('tasks')
        .update({ status, updated_by: req.user.id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('status')
        .single();

      if (error) throw error;
      res.json({ status: data.status });
    } catch (err) {
      console.error(err);
      res.status(422).json({ message: 'Error updating task status', error: err.message });
    }
  }

  static async destroy(req, res) {
    try {
      const supabase = TaskController.getSupabaseWithAuth(req);
      const { task: id } = req.params;

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Task deleted.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error deleting task', error: err.message });
    }
  }

  // --- Formatting Helpers ---
  static formatTask(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      start_date: task.start_date,
      due_date: task.due_date,
      project: task.project ? { id: task.project.id, name: task.project.project_name } : null,
      phase: task.phase ? { id: task.phase.id, name: task.phase.phase_key } : null,
      milestone: task.milestone ? {
        id: task.milestone.id,
        name: task.milestone.milestone_name,
        has_quantity: Boolean(task.milestone.has_quantity),
        target_quantity: task.milestone.target_quantity,
        current_quantity: task.milestone.current_quantity,
        unit_of_measure: task.milestone.unit_of_measure
      } : null,
      assigned_by: task.assignedBy ? { id: task.assignedBy.id, name: `${task.assignedBy.first_name} ${task.assignedBy.last_name}` } : null,
      assigned_to: task.assignedTo ? { id: task.assignedTo.id, name: `${task.assignedTo.first_name} ${task.assignedTo.last_name}` } : null,
      created_by: task.creator ? { id: task.creator.id, name: `${task.creator.first_name} ${task.creator.last_name}` } : null,
      comments_count: task.comments?.length || 0,
      attachments_count: task.attachments?.length || 0,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  }

  static formatTaskDetail(task) {
    const base = TaskController.formatTask(task);
    
    base.updater = task.updater ? { id: task.updater.id, name: `${task.updater.first_name} ${task.updater.last_name}` } : null;
    
    base.comments = (task.comments || []).map(c => ({
      id: c.id,
      comment: c.comment,
      created_at: c.created_at,
      user: c.user ? { id: c.user.id, name: `${c.user.first_name} ${c.user.last_name}` } : null
    }));

    base.attachments = (task.attachments || []).map(a => ({
      id: a.id,
      file_name: a.file_name,
      file_type: a.file_type,
      file_size: a.file_size,
      created_at: a.created_at,
      uploader: a.uploader ? { id: a.uploader.id, name: `${a.uploader.first_name} ${a.uploader.last_name}` } : null,
      download_url: `/api/tasks/${task.id}/attachments/${a.id}/download` // Simulated route if needed by phase 4
    }));

    base.progress_logs = (task.progress_logs || []).map(log => ({
      id: log.id,
      quantity_accomplished: log.quantity_accomplished,
      evidence_image_path: log.evidence_image_path,
      remarks: log.remarks,
      ai_verification_status: log.ai_verification_status,
      created_at: log.created_at,
      user: log.creator ? { id: log.creator.id, name: `${log.creator.first_name} ${log.creator.last_name}` } : null
    }));

    return base;
  }
}

module.exports = TaskController;
