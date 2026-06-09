const MilestoneService = require('../services/MilestoneService');
const EvmService = require('../services/EvmService');
const AiAssessmentService = require('../services/AiAssessmentService');
const { applyProjectVisibility, getMemberProjectIds } = require('../utils/visibility');
const NotificationService = require('../services/NotificationService');
const { createClient } = require('@supabase/supabase-js');

class ProjectController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static getSupabaseAdmin() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  static async index(req, res) {
    try {
      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const { search, status, sub_status, created_by, sort, per_page } = req.query;

      let query = supabaseWithAuth.from('projects')
        .select(`
          *,
          created_by_user:users!created_by(id, first_name, last_name, role),
          project_in_charge:users!project_in_charge_id(id, first_name, last_name, role)
        `, { count: 'exact' });

      // Apply granular visibility based on user role
      const memberProjectIds = await getMemberProjectIds(supabaseWithAuth, req.user.id);
      query = applyProjectVisibility(query, req.user, memberProjectIds);

      // BuildSphere filters mappings
      if (search) {
        query = query.or(`project_name.ilike.%${search}%,client_name.ilike.%${search}%,project_code.ilike.%${search}%`);
      }
      if (req.query.status) {
        query = query.eq('status', req.query.status.toLowerCase());
      }
      if (sub_status) {
        if (sub_status.toLowerCase() === 'draft') {
          query = query.ilike('sub_status', 'draft');
        } else if (sub_status === 'for_accounting_approval') {
          query = query.or('sub_status.eq.for_accounting_approval,and(sub_status.eq.pending_approval,accounting_approved_at.is.null)');
        } else if (sub_status === 'for_executives_approval') {
          query = query.or('sub_status.eq.for_executives_approval,and(sub_status.eq.pending_approval,accounting_approved_at.not.is.null)');
        } else {
          query = query.ilike('sub_status', sub_status);
        }
      }
      if (created_by) query = query.eq('created_by', created_by);

      let orderColumn = 'created_at';
      let ascending = false;
      if (req.query.status) {
        orderColumn = 'project_name';
        ascending = true;
      }

      if (sort === 'oldest') { orderColumn = 'created_at'; ascending = true; }
      if (sort === 'start_date') { orderColumn = 'start_date'; ascending = true; }
      if (sort === 'end_date') { orderColumn = 'end_date'; ascending = true; }
      if (sort === 'alphabetical') { orderColumn = 'project_name'; ascending = true; }
      query = query.order(orderColumn, { ascending });

      // Pagination
      const from = 0;
      const to = parseInt(per_page || 12) - 1;
      query = query.range(from, to);

      const { data: projects, error, count } = await query;
      if (error) throw error;

      // Map to snake_case relations for frontend parity and calculate progress
      const formattedProjects = await Promise.all(projects.map(async p => {
        let progress = 0;
        if (p.status === 'ongoing') {
            try {
                const progressData = await MilestoneService.getProjectMilestonesProgress(p.id);
                progress = progressData.project_progress || 0;
            } catch (err) {
                console.error(`Error calculating progress for project ${p.id}`, err);
            }
        } else if (p.status === 'completed') {
            progress = 100;
        }

        return {
          ...p,
          progress,
          created_by: p.created_by_user ? {
            id: p.created_by_user.id,
            name: `${p.created_by_user.first_name} ${p.created_by_user.last_name}`
          } : null,
          project_in_charge: p.project_in_charge ? {
            id: p.project_in_charge.id,
            name: `${p.project_in_charge.first_name} ${p.project_in_charge.last_name}`
          } : null
        };
      }));

      res.json({
        data: formattedProjects,
        meta: { 
          total: count, 
          per_page: parseInt(per_page || 12),
          current_page: 1,
          last_page: Math.ceil(count / parseInt(per_page || 12)) || 1
        }
      });
    } catch (error) {
      console.error('Project Index Error:', error);
      res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
  }

  static async show(req, res) {
    try {
      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      // 1. Fetch Project with primary relations
      let query = supabase
        .from('projects')
        .select(`
          *,
          created_by_user:users!created_by(*),
          project_in_charge:users!project_in_charge_id(*),
          members:project_user(*, users!user_id(*)),
          approvals:project_approvals(*, approver:users!approver_user_id(*)),
          milestones:project_milestones(*, created_by_user:users!created_by(*))
        `)
        .eq('id', id);

      // Apply visibility check
      const memberProjectIds = await getMemberProjectIds(supabase, req.user.id);
      query = applyProjectVisibility(query, req.user, memberProjectIds);

      const { data: project, error } = await query.single();

      if (error) throw error;

      // 2. Fetch Tasks for this project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, title, created_at')
        .eq('project_id', id);

      // 3. Fetch Inventory for "Actual" cost calculation
      const { data: inventory } = await supabase
        .from('project_inventory_items')
        .select('id, price, current_stock')
        .eq('project_id', id);

      // 4. Fetch Progress Logs for Activity Feed
      const { data: rawLogs } = await supabase
        .from('task_progress_logs')
        .select(`
          id, quantity_accomplished, remarks, created_at,
          creator:users!created_by(id, first_name, last_name),
          milestone:project_milestones!inner(project_id)
        `)
        .eq('milestone.project_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      // 5. Fetch Project Files
      const { data: projectFiles } = await supabase
        .from('project_files')
        .select(`
          id, file_name, file_type, created_at,
          uploader:users!uploaded_by(first_name, last_name)
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      // --- CALCULATIONS ---

      // A. Days Left & Status Metrics
      let daysLeft = null;
      let statusLabel = 'on_track';
      if (project.end_date) {
        const diff = new Date(project.end_date) - new Date();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }

      // B. Project Progress (Weighted by Phases)
      const progressData = await MilestoneService.getProjectMilestonesProgress(id);
      const progress = progressData.project_progress;

      // Also need counts for the tasks summary card
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

      if (daysLeft !== null) {
        if (daysLeft < 14 && progress < 80) statusLabel = 'near_due';
        if (daysLeft <= 0 && progress < 100) statusLabel = 'delayed';
      }

      // C. Cost Data
      const plannedCost = parseFloat(project.budget_for_materials || 0);
      let actualCost = 0;
      
      if (inventory && inventory.length > 0) {
        const itemIds = inventory.map(item => item.id);
        const { data: invLogs } = await supabase
          .from('project_inventory_logs')
          .select('item_id, quantity')
          .eq('action_type', 'RECEIVING')
          .in('item_id', itemIds);
        
        const receivedMap = {};
        if (invLogs) {
          invLogs.forEach(log => {
            receivedMap[log.item_id] = (receivedMap[log.item_id] || 0) + parseFloat(log.quantity || 0);
          });
        }

        actualCost = inventory.reduce((sum, item) => {
          const totalReceived = receivedMap[item.id] || 0;
          const purchasedQty = Math.max(totalReceived, parseFloat(item.current_stock || 0));
          return sum + (parseFloat(item.price || 0) * purchasedQty);
        }, 0);
      }

      // D. Recent Activities (Unified Approvals + Logs)
      const helperFormatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      };
      
      const helperHumanTime = (dateStr) => {
        const diff = new Date() - new Date(dateStr);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
      };

      const activities = [];
      (project.approvals || []).forEach(app => {
        if (app.accounting_approved_at) {
          activities.push({
            id: `app-acc-${app.id}`,
            user_name: app.approver ? `${app.approver.first_name} ${app.approver.last_name}` : 'Accounting',
            action: 'approved the project budget',
            created_at_date: helperFormatDate(app.accounting_approved_at),
            created_at_human: helperHumanTime(app.accounting_approved_at),
            type: 'approval'
          });
        }
      });
      (rawLogs || []).forEach(log => {
        activities.push({
          id: `log-${log.id}`,
          user_name: log.creator ? `${log.creator.first_name} ${log.creator.last_name}` : 'Engineer',
          action: `logged progress: ${log.remarks || 'No remarks'}`,
          created_at_date: helperFormatDate(log.created_at),
          created_at_human: helperHumanTime(log.created_at),
          type: 'update'
        });
      });

      // E. Final Format
      const formatted = {
        ...project,
        status_metrics: {
          status: statusLabel,
          days_left: daysLeft
        },
        progress,
        client_name: project.client_name || (project.created_by_user ? 'Draft Project' : 'Unnamed'),
        cost_data: {
          planned: plannedCost,
          actual: actualCost
        },
        tasks_summary: {
          total: totalTasks,
          completed: completedTasks,
          planned: totalTasks
        },
        recent_activities: activities,
        team_members: (project.members || []).map(m => {
          const u = m.users || {};
          const first = u.first_name || '';
          const last = u.last_name || '';
          return {
            id: u.id,
            name: `${first} ${last}`.trim() || 'Unknown',
            initials: ((first[0] || '') + (last[0] || '')).toUpperCase() || 'U',
            role: u.role,
            role_in_project: m.role_in_project
          };
        }),
        created_by: project.created_by_user ? {
          id: project.created_by_user.id,
          name: `${project.created_by_user.first_name} ${project.created_by_user.last_name}`
        } : null,
        project_in_charge: project.project_in_charge ? {
          id: project.project_in_charge.id,
          name: `${project.project_in_charge.first_name} ${project.project_in_charge.last_name}`
        } : null,
        recent_project_files: (projectFiles || []).map(f => ({
          id: f.id,
          file_name: f.file_name,
          uploaded_by: f.uploader ? `${f.uploader.first_name} ${f.uploader.last_name}` : 'Unknown',
          uploaded_at_human: helperHumanTime(f.created_at)
        }))
      };

      res.json({ data: formatted });
    } catch (error) {
      console.error('Project Details Error:', error);
      res.status(500).json({ message: 'Error fetching project details', error: error.message });
    }
  }

  static async store(req, res) {
    try {
      const user = req.user;
      const role = (user.role || '');
      
      // RBAC: Only Sales or Admin can propose new projects
      if (!['Sales', 'Admin'].includes(role)) {
        return res.status(403).json({ message: 'Unauthorized. Only Sales can create projects.' });
      }

      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      
      const payload = { ...req.body, created_by: user.id };
      if (payload.status) payload.status = payload.status.toLowerCase();
      else payload.status = 'proposed';

      if (!payload.sub_status) payload.sub_status = 'Draft';
      
      // Auto-generate project code
      const year = new Date().getFullYear();
      const prefix = `PRJ-${year}-`;
      
      // Use admin client for code generation to bypass RLS issues if necessary
      const supabaseAdmin = ProjectController.getSupabaseAdmin();
      
      const { data: lastProjects } = await supabaseAdmin
        .from('projects')
        .select('project_code')
        .ilike('project_code', `${prefix}%`)
        .order('project_code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastProjects && lastProjects.length > 0) {
        const lastCode = lastProjects[0].project_code;
        const lastNoMatch = lastCode.match(/\d+$/);
        if (lastNoMatch) {
          nextNumber = parseInt(lastNoMatch[0]) + 1;
        }
      }
      payload.project_code = prefix + nextNumber.toString().padStart(4, '0');

      const { data: newProject, error } = await supabaseWithAuth
        .from('projects')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;

      // --- Notification Trigger: New Project Proposal ---
      if (newProject.status === 'proposed' || newProject.status !== 'active') {
        try {
          const supabaseAdmin = ProjectController.getSupabaseAdmin();
          
          // 1. Notify Executives
          const { data: execs } = await supabaseAdmin
            .from('users')
            .select('id')
            .in('role', ['CEO', 'COO']);
          
          if (execs) {
            for (const exec of execs) {
              await NotificationService.createNotification(
                exec.id,
                'New Project Proposal',
                `A new project proposal '${newProject.project_name}' has been submitted and is awaiting approval.`,
                'info',
                `/projects/${newProject.id}`
              );
            }
          }

          // 2. Notify Assigned Project Engineer
          if (newProject.project_in_charge_id) {
            await NotificationService.createNotification(
              newProject.project_in_charge_id,
              'New Project Assignment',
              `You have been assigned as the Project-in-Charge for '${newProject.project_name}'. Please input the milestone plan.`,
              'info',
              `/projects/${newProject.id}`
            );
          }
        } catch (notifErr) {
          console.error('New Project Notification Error:', notifErr);
        }
      }

      res.status(201).json({ data: newProject });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(422).json({ message: 'Error creating project', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      const { data: updatedProject, error } = await supabaseWithAuth
        .from('projects')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // --- Notification Trigger: Project Reassignment ---
      if (req.body.project_in_charge_id) {
        try {
          await NotificationService.createNotification(
            updatedProject.project_in_charge_id,
            'New Project Assignment',
            `You have been assigned as the Project-in-Charge for '${updatedProject.project_name}'. Please input the milestone plan.`,
            'info',
            `/projects/${updatedProject.id}`
          );
        } catch (notifErr) {
          console.error('Project Reassignment Notification Error:', notifErr);
        }
      }

      res.json({ data: updatedProject });
    } catch (error) {
      console.error('Project Update Error:', error);
      res.status(422).json({ message: 'Error updating project', error: error.message });
    }
  }

  static async destroy(req, res) {
    try {
      const user = req.user;
      const role = (user.role || '');

      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      // 1. Fetch project to check status and role
      const { data: project } = await supabaseWithAuth.from('projects').select('status, sub_status').eq('id', id).single();
      
      if (!project) return res.status(404).json({ message: 'Project not found.' });

      // RBAC: Only Sales can delete, and only if Proposed/Draft
      if (role !== 'Sales' && role !== 'Admin') {
        return res.status(403).json({ message: 'Unauthorized. Only Sales can delete projects.' });
      }

      if (project.status !== 'proposed') {
        return res.status(422).json({ message: 'Only proposed projects in draft can be deleted.' });
      }

      const { error } = await supabaseWithAuth
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Project deleted.' });
    } catch (error) {
      console.error('Project Delete Error:', error);
      res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
  }

  static async getAiAssessment(req, res) {
    try {
      const { id } = req.params;
      const evmData = await EvmService.getProjectEvmData(id);
      
      const assessment = await AiAssessmentService.generateEvmReport(evmData);
      res.json(assessment);
    } catch (error) {
      console.error('Error generating AI assessment:', error);
      res.status(500).json({ error: 'AI assessment failed', message: error.message });
    }
  }

  static async statuses(req, res) {
    res.json(['Proposed', 'Ongoing', 'Completed']);
  }

  static async phaseTitles(req, res) {
    try {
      // Official list from legacy App\Enums\ProjectPhaseTitle
      const officialPhases = [
        { key: 'PREPARATION_PLANNING',   label: 'Preparation & Planning' },
        { key: 'CLIENT_KICKOFF_MEETING', label: 'Client Kick-off Meeting' },
        { key: 'PROCUREMENT',            label: 'Procurement' },
        { key: 'MOBILIZATION',           label: 'Mobilization' },
        { key: 'EXECUTION',              label: 'Execution' },
        { key: 'COMPLETION',             label: 'Completion' },
        { key: 'CLOSE_OUT',              label: 'Close Out' }
      ];
      
      res.json(officialPhases);
    } catch (error) {
      console.error('Error fetching phase titles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getEvmData(req, res) {
    try {
      const { id } = req.params;
      const data = await EvmService.getProjectEvmData(id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async addTeamMember(req, res) {
    try {
      const user = req.user;
      const role = (user.role || '');

      // RBAC: CEO, COO, or HR only
      if (!['CEO', 'COO', 'HR', 'Admin'].includes(role)) {
        return res.status(403).json({ message: 'Unauthorized. Only CEO, COO, or HR can manage the project team.' });
      }

      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;
      const { members } = req.body; // Expect an array of { user_id, role_in_project }

      if (!members || !Array.isArray(members)) {
          // fallback for single member
          const { user_id, role_in_project } = req.body;
          if (!user_id) return res.status(422).json({ message: 'User ID is required.' });
          
          const { data: existing } = await supabase.from('project_user').select('*').eq('project_id', id).eq('user_id', user_id).maybeSingle();
          if (existing) return res.status(422).json({ message: 'User is already a member of this project.' });

          const { error } = await supabase.from('project_user').insert([{ project_id: id, user_id, role_in_project }]);
          if (error) throw error;
          return res.json({ message: 'Team member added successfully.' });
      }

      // Bulk add
      for (const m of members) {
          const { data: existing } = await supabase.from('project_user').select('*').eq('project_id', id).eq('user_id', m.user_id).maybeSingle();
          if (!existing) {
              await supabase.from('project_user').insert([{ project_id: id, user_id: m.user_id, role_in_project: m.role_in_project }]);
          }
      }
      res.status(201).json({ message: 'Team members added successfully.' });
    } catch (error) {
      console.error('Add Team Member Error:', error);
      res.status(500).json({ message: 'Error adding team member', error: error.message });
    }
  }

  static async removeTeamMember(req, res) {
    try {
      const user = req.user;
      const role = (user.role || '');
      if (!['CEO', 'COO', 'HR', 'Admin'].includes(role)) {
        return res.status(403).json({ message: 'Unauthorized.' });
      }
      const { id, userId } = req.params;
      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { error } = await supabase.from('project_user').delete().eq('project_id', id).eq('user_id', userId);
      if (error) throw error;
      res.json({ message: 'Team member removed successfully.' });
    } catch (error) {
      console.error('Remove Team Member Error:', error);
      res.status(500).json({ message: 'Error removing team member', error: error.message });
    }
  }

  static async getMilestones(req, res) {
    try {
      const { id } = req.params;
      const supabase = ProjectController.getSupabaseWithAuth(req);

      // Check visibility first
      const memberProjectIds = await getMemberProjectIds(supabase, req.user.id);
      let visibleQuery = supabase.from('projects').select('id').eq('id', id);
      visibleQuery = applyProjectVisibility(visibleQuery, req.user, memberProjectIds);
      const { data: isVisible } = await visibleQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized access to project milestones.' });
      }

      const data = await MilestoneService.getProjectMilestonesProgress(id);
      res.json(data.phases);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMilestonePlan(req, res) {
    try {
      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      // Check visibility as a safety measure
      const memberProjectIds = await getMemberProjectIds(supabase, req.user.id);
      let visibleQuery = supabase.from('projects').select('id').eq('id', id);
      visibleQuery = applyProjectVisibility(visibleQuery, req.user, memberProjectIds);
      const { data: isVisible } = await visibleQuery.single();

      if (!isVisible) {
        return res.status(403).json({ message: 'Unauthorized access to milestone plan.' });
      }

      const { data: phases, error } = await supabase
        .from('project_phases')
        .select('*, milestones:project_milestones(*)')
        .eq('project_id', id)
        .order('sequence_no', { ascending: true });
        
      if (error) throw error;
      res.json({ phases: phases || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async storeMilestonePlan(req, res) {
    try {
      const user = req.user;
      const role = (user.role || '');
      const { id: projectId } = req.params;
      const { phases } = req.body;

      // RBAC: Only Project Engineers can plan milestones
      if (!['Project Engineer', 'Admin'].includes(role)) {
        return res.status(403).json({ message: 'Unauthorized. Only Project Engineers can store milestone plans.' });
      }

      const supabase = ProjectController.getSupabaseWithAuth(req);

      // Clean up existing data first
      // Note: project_milestones has FK to project_phases with cascade on delete
      await supabase.from('project_phases').delete().eq('project_id', projectId);

      if (phases && Array.isArray(phases)) {
        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];
          const { data: newPhase, error: phaseError } = await supabase
            .from('project_phases')
            .insert([{
              project_id: projectId,
              phase_key: phase.phase_key || phase.id, // Fallback if key missing
              weight_percentage: phase.weight_percentage,
              start_date: phase.start_date,
              end_date: phase.end_date,
              sequence_no: i,
              created_by: user.id
            }])
            .select()
            .single();

          if (phaseError) throw phaseError;

            if (phase.milestones && phase.milestones.length > 0) {
              const msTotalWeight = phase.milestones.reduce((sum, ms) => sum + parseFloat(ms.weight_percentage || 0), 0);
              
              if (Math.abs(msTotalWeight - 100) > 0.01) {
                throw new Error(`The sum of milestone weights in phase "${phase.phase_key}" must equal exactly 100%. Current total: ${msTotalWeight}%`);
              }

              const milestonesPayload = phase.milestones.map((ms, msIdx) => ({
                project_id: projectId,
                project_phase_id: newPhase.id,
                milestone_name: ms.milestone_name,
                weight_percentage: parseFloat(ms.weight_percentage || 0),
                start_date: ms.start_date,
                end_date: ms.end_date,
                has_quantity: !!ms.has_quantity,
                target_quantity: ms.quantity_target || 0,
                current_quantity: 0,
                sequence_no: msIdx,
                created_by: user.id
              }));

              const { error: msError } = await supabase
                .from('project_milestones')
                .insert(milestonesPayload);

              if (msError) throw msError;
            }
        }
      }

      res.status(201).json({ message: 'Milestone plan stored successfully' });
    } catch (error) {
      console.error('Store Milestone Plan Error:', error);
      res.status(422).json({ message: 'Error storing milestone plan', error: error.message });
    }
  }

  static async getMilestoneChart(req, res) {
    try {
      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      const { data: project } = await supabase.from('projects').select('start_date, end_date').eq('id', id).single();
      const { data: phases } = await supabase
        .from('project_phases')
        .select(`
          *, 
          created_by_user:users!created_by(id, first_name, last_name, role),
          milestones:project_milestones(*)
        `)
        .eq('project_id', id)
        .order('sequence_no', { ascending: true });

      if (!project || !phases || phases.length === 0) {
        return res.json({ timeline_months: [], phases: [], submitted_by: null, submitted_at: null });
      }

      // Fetch Detailed Progress Data (Phases -> Milestones -> Tasks)
      const progressData = await MilestoneService.getProjectMilestonesProgress(id);

      // Generate timeline months from the full range (Project + Phases + Milestones)
      let minDate = new Date(project.start_date);
      let maxDate = new Date(project.end_date);

      phases.forEach(p => {
        if (p.start_date && new Date(p.start_date) < minDate) minDate = new Date(p.start_date);
        if (p.end_date && new Date(p.end_date) > maxDate) maxDate = new Date(p.end_date);
        
        (p.milestones || []).forEach(ms => {
          if (ms.start_date && new Date(ms.start_date) < minDate) minDate = new Date(ms.start_date);
          if (ms.end_date && new Date(ms.end_date) > maxDate) maxDate = new Date(ms.end_date);
        });
      });

      const timeline_months = [];
      let current = new Date(minDate);
      current.setDate(1); 
      const end = new Date(maxDate);
      
      let limit = 0;
      while (current <= end && limit < 120) {
        const key = current.toISOString().substring(0, 7);
        const label = current.toLocaleString('default', { month: 'long' });
        timeline_months.push({ key, label, year: current.getFullYear() });
        current.setMonth(current.getMonth() + 1);
        limit++;
      }

      // Merge Progress Data with Gantt month_spans
      const formattedPhases = progressData.phases.map(p => {
        // Find the raw phase to get start/end dates for milestones
        const rawPhase = phases.find(rp => rp.id === p.id);
        
        return {
          ...p,
          phase_title: p.name, // Ensure both property names exist for compatibility
          // Merge start_date and end_date from the raw phase (MilestoneService doesn't include these)
          start_date: rawPhase?.start_date || null,
          end_date: rawPhase?.end_date || null,
          weight_percentage: rawPhase?.weight_percentage || p.weight_percentage || 0,
          milestones: p.milestones.map(ms => {
            const rawMs = (rawPhase?.milestones || []).find(rm => rm.id === ms.id);
            
            // Calculate month spans for this milestone
            const monthSpans = [];
            if (rawMs?.start_date && rawMs?.end_date) {
                let mCurrent = new Date(rawMs.start_date);
                const mEnd = new Date(rawMs.end_date);
                let mLimit = 0;
                while (mCurrent <= mEnd && mLimit < 60) {
                  monthSpans.push(mCurrent.toISOString().substring(0, 7));
                  mCurrent.setMonth(mCurrent.getMonth() + 1);
                  mLimit++;
                }
            }

            return {
              ...ms,
              // Merge start_date and end_date from raw milestone data
              start_date: rawMs?.start_date || ms.start_date || null,
              end_date: rawMs?.end_date || ms.end_date || null,
              has_quantity: rawMs?.has_quantity || false,
              quantity_target: rawMs?.target_quantity || rawMs?.quantity_target || null,
              month_spans: monthSpans
            };
          })
        };
      });

      // Extract submission details from the first phase
      const creator = phases[0].created_by_user;
      const submitted_by = creator ? `${creator.first_name} ${creator.last_name}` : null;
      const submitted_at = phases[0].created_at;

      // Extract approval history
      const { data: approvals } = await supabase
        .from('project_approvals')
        .select(`
          *,
          approver:users!approver_user_id(first_name, last_name)
        `)
        .eq('project_id', id)
        .order('decided_at', { ascending: true });

      const approval_history = (approvals || []).map(app => ({
        stage: app.approval_stage,
        decision: app.decision,
        decided_at: app.decided_at,
        approver_name: app.approver ? `${app.approver.first_name} ${app.approver.last_name}` : 'Unknown Status',
        comments: app.comments
      }));

      res.json({ 
        timeline_months, 
        phases: formattedPhases, 
        submitted_by, 
        submitted_at,
        approval_history
      });
    } catch (error) {
      console.error('Get Milestone Chart Error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async submitMilestoneReview(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const role = (user.role || '');

      // RBAC: Only Project Engineers can submit for review
      if (!['Project Engineer', 'Admin'].includes(role)) {
        return res.status(403).json({ message: 'Unauthorized. Only Project Engineers can submit milestone plans for review.' });
      }

      const supabase = ProjectController.getSupabaseWithAuth(req);

      // 1. Verify project exists, is proposed, and is in an editable sub-status
      const { data: project, error: fetchErr } = await supabase
        .from('projects')
        .select('status, sub_status, project_name')
        .eq('id', id)
        .single();
      
      if (fetchErr || !project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      if (project.status !== 'proposed') {
        return res.status(422).json({ message: 'Only proposed projects can have milestones submitted for review.' });
      }

      // 2. Update project status to "for_accounting_approval"
      const { error } = await supabase
        .from('projects')
        .update({ sub_status: 'for_accounting_approval' })
        .eq('id', id);

      if (error) throw error;

      // 3. Notify Accounting users
      try {
        const supabaseAdmin = ProjectController.getSupabaseAdmin();
        const { data: accountingUsers } = await supabaseAdmin
          .from('users')
          .select('id')
          .ilike('role', '%accounting%');
        
        if (accountingUsers && accountingUsers.length > 0) {
          for (const accUser of accountingUsers) {
            await NotificationService.createNotification(
              accUser.id,
              'Project For Accounting Approval',
              `Project '${project.project_name || 'Unnamed'}' is now awaiting accounting approval.`,
              'info',
              `/projects/${id}`
            );
          }
        }
      } catch (notifErr) {
        console.error('Accounting Approval Notification Error:', notifErr);
      }

      res.json({ message: 'Milestones submitted for review. Project updated to for_accounting_approval.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async complete(req, res) {
    try {
      const { id } = req.params;
      const supabase = ProjectController.getSupabaseWithAuth(req);

      // 1. Fetch progress data
      const progressData = await MilestoneService.getProjectMilestonesProgress(id);
      
      // 2. Strict Validation: Progress must be 100
      if (progressData.project_progress < 100) {
        return res.status(422).json({
          message: `Cannot complete project: Current progress is only ${progressData.project_progress}%.`,
          errors: { progress: ['Project must be at 100% progress to be completed.'] }
        });
      }

      // 3. Strict Validation: All tasks must be completed
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('project_id', id)
        .not('status', 'eq', 'completed'); // Flexible check for non-completed

      if (pendingTasks && pendingTasks.length > 0) {
        return res.status(422).json({
          message: `Cannot complete project: ${pendingTasks.length} tasks are still pending.`,
          errors: { tasks: pendingTasks.map(t => t.title) }
        });
      }

      // 4. Update status
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Project successfully marked as completed.',
        data: updatedProject
      });
    } catch (error) {
      console.error('Project Completion Error:', error);
      res.status(500).json({ message: 'Error completing project', error: error.message });
    }
  }


}

module.exports = ProjectController;
