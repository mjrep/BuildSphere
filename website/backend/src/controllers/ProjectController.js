const MilestoneService = require('../services/MilestoneService');
const { createClient } = require('@supabase/supabase-js');

class ProjectController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
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

      // BuildSphere filters mappings
      if (search) {
        query = query.or(`project_name.ilike.%${search}%,client_name.ilike.%${search}%,project_code.ilike.%${search}%`);
      }
      if (req.query.status) {
        query = query.eq('status', req.query.status.toLowerCase());
      }
      if (sub_status) query = query.eq('sub_status', sub_status);
      if (created_by) query = query.eq('created_by', created_by);

      let orderColumn = 'created_at';
      let ascending = false;
      if (sort === 'oldest') ascending = true;
      if (sort === 'start_date') { orderColumn = 'start_date'; ascending = true; }
      if (sort === 'end_date') { orderColumn = 'end_date'; ascending = true; }
      query = query.order(orderColumn, { ascending });

      const { data: projects, error, count } = await query;
      if (error) throw error;

      // Map to snake_case relations for frontend parity
      const formattedProjects = projects.map(p => ({
        ...p,
        created_by: p.created_by_user ? {
          id: p.created_by_user.id,
          name: `${p.created_by_user.first_name} ${p.created_by_user.last_name}`
        } : null,
        project_in_charge: p.project_in_charge ? {
          id: p.project_in_charge.id,
          name: `${p.project_in_charge.first_name} ${p.project_in_charge.last_name}`
        } : null
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
      console.error(error);
      res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
  }

  static async show(req, res) {
    try {
      const supabase = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      // 1. Fetch Project with primary relations
      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_user:users!created_by(*),
          project_in_charge:users!project_in_charge_id(*),
          members:project_user(users!user_id(*)),
          approvals:project_approvals(*, approver:users!approver_user_id(*)),
          milestones:project_milestones(*, created_by_user:users!created_by(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // 2. Fetch Tasks for this project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, title, created_at')
        .eq('project_id', id);

      // 3. Fetch Inventory for "Actual" cost calculation
      const { data: inventory } = await supabase
        .from('project_inventory_items')
        .select('price, current_stock')
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

      // --- CALCULATIONS ---

      // A. Days Left & Status Metrics
      let daysLeft = null;
      let statusLabel = 'on_track';
      if (project.end_date) {
        const diff = new Date(project.end_date) - new Date();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }

      // B. Tasks Summary & Progress
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      if (daysLeft !== null) {
        if (daysLeft < 14 && progress < 80) statusLabel = 'near_due';
        if (daysLeft <= 0 && progress < 100) statusLabel = 'delayed';
      }

      // C. Cost Data
      const plannedCost = parseFloat(project.budget_for_materials || 0);
      const actualCost = (inventory || []).reduce((sum, item) => {
        return sum + (parseFloat(item.price || 0) * parseFloat(item.current_stock || 0));
      }, 0);

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

      const activities = [
        ...(project.approvals || []).map(a => ({
          id: `appr-${a.id}`,
          user_name: a.approver ? `${a.approver.first_name} ${a.approver.last_name}` : 'System',
          action: 'REVIEW',
          description: `${a.type || 'Action'} ${(a.status || 'updated').toLowerCase()} the project.`,
          created_at: a.created_at,
          created_at_date: helperFormatDate(a.created_at),
          created_at_human: helperHumanTime(a.created_at)
        })),
        ...(rawLogs || []).map(l => ({
          id: `log-${l.id}`,
          user_name: l.creator ? `${l.creator.first_name} ${l.creator.last_name}` : 'System',
          action: 'COMPLETE',
          description: `updated progress with ${l.quantity_accomplished} units.`,
          created_at: l.created_at,
          created_at_date: helperFormatDate(l.created_at),
          created_at_human: helperHumanTime(l.created_at)
        }))
      ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

      // Final Response
      const formatted = {
        ...project,
        created_by: project.created_by_user ? {
          ...project.created_by_user,
          name: `${project.created_by_user.first_name} ${project.created_by_user.last_name}`
        } : null,
        project_in_charge: project.project_in_charge ? {
          ...project.project_in_charge,
          name: `${project.project_in_charge.first_name} ${project.project_in_charge.last_name}`
        } : null,
        progress,
        status_metrics: {
          status: statusLabel,
          days_left: daysLeft
        },
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
        })
      };

      res.json({ data: formatted });
    } catch (error) {
      console.error('Project Details Error:', error);
      res.status(500).json({ message: 'Error fetching project details', error: error.message });
    }
  }

  static async store(req, res) {
    try {
      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const user = req.user;
      
      const payload = { ...req.body, created_by: user.id };
      if (payload.status) payload.status = payload.status.toLowerCase();
      else payload.status = 'proposed';

      if (!payload.sub_status) payload.sub_status = 'Draft';
      
      // Auto-generate project code
      const year = new Date().getFullYear();
      const prefix = `PRJ-${year}-`;
      const { data: lastProjects } = await supabaseWithAuth
        .from('projects')
        .select('project_code')
        .ilike('project_code', `${prefix}%`)
        .order('project_code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastProjects && lastProjects.length > 0) {
        const lastNo = parseInt(lastProjects[0].project_code.replace(prefix, ''));
        nextNumber = lastNo + 1;
      }
      payload.project_code = prefix + nextNumber.toString().padStart(4, '0');

      const { data: newProject, error } = await supabaseWithAuth
        .from('projects')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;

      res.status(201).json({ data: newProject });
    } catch (error) {
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
      res.json({ data: updatedProject });
    } catch (error) {
      res.status(422).json({ message: 'Error updating project', error: error.message });
    }
  }

  static async destroy(req, res) {
    try {
      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const { id } = req.params;

      // Normalized role check
      if (req.user.role !== 'sales') {
         // Logic for restricted roles...
      }

      const { error } = await supabaseWithAuth
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
  }

  static async statuses(req, res) {
    res.json({
      main: [
        { value: 'proposed', label: 'Proposed', badge_label: 'Proposed', badge_color: 'gray' },
        { value: 'ongoing', label: 'Ongoing', badge_label: 'Ongoing', badge_color: 'blue' },
        { value: 'completed', label: 'Completed', badge_label: 'Completed', badge_color: 'green' }
      ],
      sub: [
        { value: 'Draft', label: 'Draft', badge_color: 'gray' },
        { value: 'Pending Approval', label: 'Pending Approval', badge_color: 'yellow' },
        { value: 'For Revision', label: 'For Revision', badge_color: 'red' }
      ]
    });
  }

  static async phaseTitles(req, res) {
    res.json({ message: "Phase titles fetched." });
  }

  static async addTeamMember(req, res) {
    try {
      const supabaseWithAuth = ProjectController.getSupabaseWithAuth(req);
      const projectId = req.params.id;
      const { user_id, role_in_project } = req.body;

      const { error } = await supabaseWithAuth
        .from('project_user')
        .insert([{
           project_id: projectId,
           user_id: user_id,
           role_in_project,
           assigned_by: req.user.id
        }]);

      if (error) throw error;
      res.json({ message: 'Team member added successfully.' });
    } catch (error) {
      res.status(422).json({ message: 'Error adding member', error: error.message });
    }
  }

  static async getMilestones(req, res) {
    try {
      const { id } = req.params;
      const data = await MilestoneService.getProjectMilestonesProgress(id);
      res.json(data);
    } catch (error) {
      console.error('Error fetching milestones progress:', error);
      res.status(500).json({ message: 'Error calculating milestone progress', error: error.message });
    }
  }

  static async getMilestonePlan(req, res) {
    res.json({ message: "Endpoint migrated." });
  }

  static async storeMilestonePlan(req, res) {
    res.json({ message: "Endpoint migrated." });
  }

  static async getMilestoneChart(req, res) {
    res.json({ message: "Endpoint migrated." });
  }

  static async submitMilestoneReview(req, res) {
    res.json({ message: "Endpoint migrated." });
  }
}

module.exports = ProjectController;
