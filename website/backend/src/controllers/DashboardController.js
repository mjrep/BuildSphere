const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

class DashboardController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  static async stats(req, res) {
    try {
      const supabaseWithAuth = DashboardController.getSupabaseWithAuth(req);
      const user = req.user;
      
      if (!user) {
         return res.status(401).json({ message: 'Unauthenticated.' });
      }

      // Fetch projects mimicking the `visibleTo` logic from Laravel
      const { data: rawProjects, error } = await supabaseWithAuth
        .from('projects')
        .select(`
          id, project_name, project_code, address, status, end_date, created_at,
          created_by, project_in_charge_id,
          project_in_charge:users!project_in_charge_id(id, first_name, last_name),
          members:project_user(users!user_id(id, first_name, last_name)),
          tasks:tasks(id, status),
          updates:tasks(
            id,
            progress_logs:task_progress_logs(id, created_at, work_date)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter visible projects
      const role = (user.role || '').toLowerCase();
      const isExec = role === 'ceo' || role === 'coo';
      
      let visibleProjects = rawProjects || [];
      if (!isExec) {
        visibleProjects = visibleProjects.filter(p => {
          if (p.created_by === user.id) return true;
          if (p.project_in_charge_id === user.id) return true;
          if (p.members?.some(m => m.users?.id === user.id)) return true;
          return false;
        });
      }

      // 1. Stats Counter
      let ongoingCount = 0;
      let proposedCount = 0;
      let completedCount = 0;

      visibleProjects.forEach(p => {
        const status = (p.status || '').toLowerCase();
        if (status === 'ongoing') ongoingCount++;
        else if (status === 'proposed') proposedCount++;
        else if (status === 'completed') completedCount++;
      });

      // 2. Project Teams (4 most recent ongoing)
      const colors = ['#706BFF', '#EC4899', '#10B981', '#F59E0B'];
      const ongoingItems = visibleProjects.filter(p => (p.status || '').toLowerCase() === 'ongoing');
      
      const projectTeams = ongoingItems.slice(0, 4).map(project => {
        const tasksDone = project.tasks?.filter(t => t.status === 'completed').length || 0;
        const tasksTotal = project.tasks?.length || 0;

        let teamMembers = [];
        if (project.project_in_charge) {
          teamMembers.push(project.project_in_charge);
        }
        
        const mappedMembers = (project.members || []).map(m => m.users);
        mappedMembers.forEach(m => {
          if (teamMembers.length < 4 && m.id !== project.project_in_charge_id) {
            teamMembers.push(m);
          }
        });

        const formattedMembers = teamMembers.map((m, idx) => {
          const first = m.first_name || 'U';
          const last = m.last_name || '';
          const initials = ((first[0] || '') + (last[0] || '')).toUpperCase() || 'U';
          return { initials, color: colors[idx % colors.length] };
        });

        const picName = project.project_in_charge 
          ? `${project.project_in_charge.first_name} ${project.project_in_charge.last_name}` 
          : 'Unassigned';

        return {
          project_name: project.project_code ? `${project.project_code} / ${project.project_name}` : project.project_name,
          location: project.address || 'No Location',
          engr_name: picName,
          tasksDone,
          tasksTotal,
          memberCount: mappedMembers.length + (project.project_in_charge ? 1 : 0),
          members: formattedMembers
        };
      });

      // 3. Ongoing Projects details
      const ongoingProjects = [...ongoingItems]
        .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
        .slice(0, 3)
        .map(project => {
          const tasksDone = project.tasks?.filter(t => t.status === 'completed').length || 0;
          const tasksTotal = project.tasks?.length || 0;
          const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
          
          let daysLeft = 0;
          if (project.end_date) {
            const diffTime = Math.max(0, new Date(project.end_date) - new Date());
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          let displayStatus = 'On Track';
          if (daysLeft < 14 && progress < 80) displayStatus = 'Near Due';
          if (daysLeft <= 0 && progress < 100) displayStatus = 'Delayed';

          return {
            project_name: project.project_name,
            progress,
            daysLeft,
            status: displayStatus
          };
        });

      // 4. Project Updates Today
      const today = new Date().toISOString().split('T')[0];
      const updatesList = ongoingItems.map(project => {
        let updatesToday = 0;
        (project.updates || []).forEach(task => {
          (task.progress_logs || []).forEach(log => {
             const createdDate = log.created_at ? log.created_at.split('T')[0] : null;
             const workDate = log.work_date ? log.work_date.split('T')[0] : null;
             if (createdDate === today || workDate === today) {
               updatesToday++;
             }
          });
        });
        return {
          project_name: project.project_name,
          updates_today: updatesToday
        };
      })
      .filter(p => p.updates_today > 0)
      .sort((a, b) => b.updates_today - a.updates_today)
      .slice(0, 4);

      while (updatesList.length < 4) {
        updatesList.push({ project_name: '—', updates_today: 0 });
      }

      res.json({
        ongoing_projects_count: ongoingCount,
        proposed_projects_count: proposedCount,
        completed_projects_count: completedCount,
        project_teams: projectTeams,
        ongoing_projects: ongoingProjects,
        project_updates: updatesList
      });

    } catch (err) {
      console.error('Dashboard Stats Error:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
}

module.exports = DashboardController;
