const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { applyProjectVisibility, getMemberProjectIds } = require('../utils/visibility');
const { getLocalNow, getLocalToday } = require('../utils/timeHelpers');
const MilestoneService = require('../services/MilestoneService');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseAnon = createClient(supabaseUrl, supabaseKey);

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

      // Fetch all projects for the dashboard stats with strict visibility filtering
      let query = supabaseWithAuth
        .from('projects')
        .select(`
          id, project_name, project_code, address, status, end_date, created_at,
          created_by, project_in_charge_id, budget_for_materials, sub_status, executive_approved_at,
          project_in_charge:users!project_in_charge_id(id, first_name, last_name, middle_name, suffix),
          members:project_user(users!user_id(id, first_name, last_name, middle_name, suffix)),
          tasks:tasks(id, status, milestone_id),
          inventory:project_inventory_items(price, current_stock, item_name, critical_level, unit),
          updates:tasks(
            id,
            progress_logs:task_progress_logs(id, created_at, work_date)
          )
        `);

      const memberProjectIds = await getMemberProjectIds(supabaseWithAuth, user.id);
      query = applyProjectVisibility(query, user, memberProjectIds);
      
      const { data: rawProjects, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let visibleProjects = rawProjects || [];

      const role = (user.role || '').toLowerCase();
      if (role === 'accounting') {
        let ongoingCount = 0;
        let proposedCount = 0;
        let completedCount = 0;

        visibleProjects.forEach(p => {
          const status = (p.status || '').toLowerCase();
          if (status === 'ongoing') ongoingCount++;
          else if (status === 'proposed') proposedCount++;
          else if (status === 'completed') completedCount++;
        });

        // Map projects to budget cards (only ongoing projects)
        const budgetAllocations = visibleProjects
          .filter(p => (p.status || '').toLowerCase() === 'ongoing')
          .map(p => {
          const budget = parseFloat(p.budget_for_materials || 0);
          const actualCost = (p.inventory || []).reduce((sum, item) => {
            return sum + (parseFloat(item.price || 0) * parseFloat(item.current_stock || 0));
          }, 0);

          let statusBadge = 'On Budget';
          if (actualCost > budget) {
            statusBadge = 'Overrun';
          } else if (actualCost >= budget * 0.8) {
            statusBadge = 'Depletion';
          }

          const asOfDate = getLocalNow().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

          return {
            id: p.id,
            project_name: p.project_name,
            as_of_date: `as of ${asOfDate}`,
            budget,
            actual_cost: actualCost,
            status_badge: statusBadge
          };
        });

        return res.json({
          role: 'accounting',
          ongoing_projects_count: ongoingCount,
          proposed_projects_count: proposedCount,
          completed_projects_count: completedCount,
          budget_allocations: budgetAllocations
        });
      }

      if (role === 'hr') {
        const { data: allUsers, error: usersError } = await supabaseAnon
          .from('users')
          .select('id, first_name, last_name, role, is_active');

        if (usersError) throw usersError;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let activeUserIdsInLastMonth = new Set();
        try {
          const { data: recentLogs } = await supabaseAnon
            .from('task_progress_logs')
            .select('created_by')
            .gte('created_at', thirtyDaysAgo.toISOString());
          
          recentLogs?.forEach(log => {
            if (log.created_by) activeUserIdsInLastMonth.add(log.created_by);
          });
        } catch (err) {
          console.error('Failed to query recent task logs for HR:', err);
        }

        let activeLastMonthCount = 0;
        let inactiveLastMonthCount = 0;

        const activeStaffList = [];

        (allUsers || []).forEach(u => {
          if (u.is_active) {
            const name = `${u.first_name} ${u.last_name}`;
            activeStaffList.push({
              id: u.id,
              name,
              role: u.role
            });

            if (activeUserIdsInLastMonth.has(u.id)) {
              activeLastMonthCount++;
            } else {
              inactiveLastMonthCount++;
            }
          }
        });

        const allowedRoles = ['project engineer', 'project coordinator', 'foreman', 'procurement', 'staff'];
        const hrFilteredStaffList = activeStaffList.filter(u => allowedRoles.includes((u.role || '').toLowerCase()));
        const hrStaffIds = new Set(hrFilteredStaffList.map(s => s.id));

        // Left Panel: Team Members (Project team assignment allocations)
        const deployedUserIds = new Set();
        const projectTeamAllocations = visibleProjects
          .filter(p => (p.status || '').toLowerCase() === 'ongoing')
          .map(p => {
          let memberCount = 0;
          (p.members || []).forEach(m => {
            const uid = m.users?.id || m.id || m.user_id;
            if (uid && hrStaffIds.has(uid)) {
                deployedUserIds.add(uid);
                memberCount++;
            }
          });
          if (p.project_in_charge_id && hrStaffIds.has(p.project_in_charge_id)) {
              deployedUserIds.add(p.project_in_charge_id);
              memberCount++;
          }

          const memberCountTotal = memberCount;
          return {
            id: p.id,
            project_name: p.project_name,
            member_count: memberCountTotal
          };
        }).filter(p => p.member_count > 0);

        const totalPersonnel = hrFilteredStaffList.length;
        const deployedPersonnel = deployedUserIds.size;
        const availablePersonnel = totalPersonnel - deployedPersonnel;

        return res.json({
          role: 'hr',
          total_personnel: totalPersonnel,
          deployed_personnel: deployedPersonnel,
          available_personnel: availablePersonnel,
          team_members_allocations: projectTeamAllocations,
          active_staffs: hrFilteredStaffList
        });
      }

      if (role === 'procurement') {
        let ongoingCount = 0;
        const ongoingProjects = [];
        visibleProjects.forEach(p => {
          if ((p.status || '').toLowerCase() === 'ongoing') {
            ongoingCount++;
            ongoingProjects.push(p);
          }
        });

        // 1. Map projects to stock statistics
        const materialsStock = ongoingProjects.map(p => {
          let inStockCount = 0;
          let lowStockCount = 0;
          let outOfStockCount = 0;

          (p.inventory || []).forEach(item => {
            const currentStock = parseFloat(item.current_stock || 0);
            const criticalLevel = parseFloat(item.critical_level || 0);

            if (currentStock === 0) {
              outOfStockCount++;
            } else if (currentStock <= criticalLevel) {
              lowStockCount++;
            } else {
              inStockCount++;
            }
          });

          const asOfDate = getLocalNow().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

          return {
            id: p.id,
            project_name: p.project_name,
            as_of_date: `as of ${asOfDate}`,
            in_stock: inStockCount,
            low_stock: lowStockCount,
            no_stock: outOfStockCount
          };
        });

        // 2. Aggregate Low Stock Alerts across ongoing projects
        const criticalAlerts = [];
        ongoingProjects.forEach(p => {
          (p.inventory || []).forEach(item => {
            const currentStock = parseFloat(item.current_stock || 0);
            const criticalLevel = parseFloat(item.critical_level || 0);

            if (currentStock <= criticalLevel) {
              criticalAlerts.push({
                project_name: p.project_name,
                item_name: item.item_name,
                current_stock: currentStock,
                critical_level: criticalLevel,
                unit: item.unit || 'units',
                status: currentStock === 0 ? 'Out of Stock' : 'Low Stock'
              });
            }
          });
        });

        return res.json({
          role: 'procurement',
          ongoing_projects_count: ongoingCount,
          materials_stock: materialsStock,
          critical_alerts: criticalAlerts
        });
      }

      if (role === 'staff') {
        // Fetch tasks assigned to this staff member
        const { data: assignedTasks, error: tasksError } = await supabaseWithAuth
          .from('tasks')
          .select(`
            id, title, status, description, created_at, due_date, priority,
            project:projects(id, project_name, project_code),
            progress_logs:task_progress_logs(id, quantity_accomplished, remarks, created_at, created_by)
          `)
          .eq('assigned_to', req.user.id);

        if (tasksError) throw tasksError;

        // Group status counts
        let pendingCount = 0;
        let ongoingCount = 0;
        let completedCount = 0;

        (assignedTasks || []).forEach(t => {
          const s = (t.status || '').toLowerCase();
          if (s === 'completed' || s === 'approved') {
            completedCount++;
          } else if (s === 'in progress' || s === 'ongoing') {
            ongoingCount++;
          } else {
            pendingCount++;
          }
        });

        const upcomingTasks = (assignedTasks || [])
          .filter(t => {
             const s = (t.status || '').toLowerCase();
             return s !== 'completed' && s !== 'approved';
          })
          .sort((a, b) => {
             if (!a.due_date) return 1;
             if (!b.due_date) return -1;
             return new Date(a.due_date) - new Date(b.due_date);
          })
          .slice(0, 10)
          .map(t => ({
             id: t.id,
             title: t.title,
             project_name: t.project?.project_name || 'General Project',
             priority: t.priority || 'medium',
             due_date: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'
          }));

        const formattedTasks = (assignedTasks || []).map(t => ({
          id: t.id,
          title: t.title,
          project_name: t.project?.project_name || 'General Project',
          status: t.status || 'To Do',
          description: t.description || 'No description provided.',
          created_at: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        return res.json({
          role: 'staff',
          total_assigned: (assignedTasks || []).length,
          pending_tasks: pendingCount,
          ongoing_tasks: ongoingCount,
          completed_tasks: completedCount,
          upcoming_tasks: upcomingTasks,
          assigned_tasks_list: formattedTasks
        });
      }

      if (role === 'sales') {
        const proposedProjects = visibleProjects.filter(p => (p.status || '').toLowerCase() === 'proposed' || (p.status || '').toLowerCase() === 'ongoing');

        let pendingCount = 0; // draft
        let forApprovalCount = 0; // pending_approval
        let forRevisionsCount = 0; // for_revision
        let approvedCount = 0; // approved or ongoing

        proposedProjects.forEach(p => {
          const status = (p.status || '').toLowerCase();
          const subStatus = (p.sub_status || '').toLowerCase();
          if (status === 'proposed') {
            if (subStatus === 'draft' || subStatus === '') pendingCount++;
            else if (['pending_approval', 'for_accounting_approval', 'for_executives_approval'].includes(subStatus)) forApprovalCount++;
            else if (subStatus === 'for_revision') forRevisionsCount++;
            else if (subStatus === 'approved') approvedCount++;
          } else if (status === 'ongoing' && p.executive_approved_at !== null) {
            approvedCount++;
          }
        });

        const proposedProjectsStatus = proposedProjects.map(p => {
          const picName = p.project_in_charge
            ? `${p.project_in_charge.first_name} ${p.project_in_charge.last_name}`
            : 'Unassigned';
          
          let displaySubStatus = 'Pending';
          const sub = (p.sub_status || '').toLowerCase();
          if (['pending_approval', 'for_accounting_approval', 'for_executives_approval'].includes(sub)) displaySubStatus = 'For Approval';
          else if (sub === 'for_revision') displaySubStatus = 'For Revisions';
          else if (sub === 'approved' || p.status === 'ongoing') displaySubStatus = 'Approved';

          return {
            id: p.id,
            project_name: p.project_name,
            engr_name: picName,
            sub_status: displaySubStatus
          };
        });

        let projectUpdates = [];
        try {
          const { data: logs } = await supabaseAnon
            .from('project_activity_logs')
            .select(`
              id,
              action,
              description,
              created_at,
              projects:project_id(project_name)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

          if (logs && logs.length > 0) {
            projectUpdates = logs.map(log => {
              const pName = log.projects ? log.projects.project_name : 'Proposed Project';
              let colorType = 'orange'; // default
              const action = (log.action || '').toUpperCase();
              if (action.includes('REJECTED') || action.includes('REVISION')) colorType = 'red';
              else if (action.includes('APPROVED') || action.includes('SUCCESS')) colorType = 'green';

              return {
                project_name: pName,
                description: log.description,
                color: colorType
              };
            });
          }
        } catch (err) {
          console.error('Failed to load project activity logs for sales:', err);
        }

        if (projectUpdates.length === 0) {
          projectUpdates = [
            {
              project_name: 'Project Alpha',
              description: 'CEO added a comment in your proposed project. Project name is now for revisions.',
              color: 'red'
            },
            {
              project_name: 'Project Beta',
              description: 'PIC added their Milestones input. Project name is now for approval.',
              color: 'orange'
            },
            {
              project_name: 'Project Gamma',
              description: 'CEO approved your proposed project. The project is now ongoing',
              color: 'green'
            }
          ];
        }

        return res.json({
          role: 'sales',
          pending_count: pendingCount,
          for_approval_count: forApprovalCount,
          for_revisions_count: forRevisionsCount,
          approved_count: approvedCount,
          proposed_projects_status: proposedProjectsStatus,
          proposed_project_updates: projectUpdates
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
      const colorPalette = ['bg-[#706BFF]', 'bg-yellow-400', 'bg-red-400', 'bg-green-400', 'bg-pink-400', 'bg-indigo-400'];
      const avatarColors = ['#706BFF', '#EC4899', '#10B981', '#F59E0B'];
      const ongoingItems = visibleProjects.filter(p => (p.status || '').toLowerCase() === 'ongoing');

      // Batch load all phases and milestones for ongoing projects in ONE lightweight query using the fast, anon client
      const ongoingProjectIds = ongoingItems.map(p => p.id);
      let bulkPhases = [];
      if (ongoingProjectIds.length > 0) {
        const { data, error: bulkError } = await supabaseAnon
          .from('project_phases')
          .select(`
            id,
            project_id,
            phase_key,
            weight_percentage,
            end_date,
            milestones:project_milestones(
              id,
              milestone_name,
              weight_percentage,
              has_quantity,
              target_quantity,
              current_quantity,
              end_date
            )
          `)
          .in('project_id', ongoingProjectIds);
        
        if (bulkError) throw bulkError;
        bulkPhases = data || [];
      }

      // Group phases by project
      const phasesByProject = new Map();
      bulkPhases.forEach(phase => {
        if (!phasesByProject.has(phase.project_id)) {
          phasesByProject.set(phase.project_id, []);
        }
        phasesByProject.get(phase.project_id).push(phase);
      });

      // Ultra-fast in-memory progress calculation using already-fetched project.tasks
      const getProgressForProject = (projectId, projectTasks = []) => {
        const projectPhases = phasesByProject.get(projectId) || [];
        
        const result = projectPhases.map((phase) => {
          const phaseMilestones = phase.milestones || [];
          const totalPhaseWeight = phaseMilestones.reduce((acc, curr) => acc + parseFloat(curr.weight_percentage || 0), 0);
          let phaseWeightedProgress = 0;

          const mappedMilestones = phaseMilestones.map((ms) => {
            const msTasks = projectTasks.filter(t => t.milestone_id === ms.id);
            const msTasksTotal = msTasks.length;
            const msTasksCompleted = msTasks.filter(t => t.status === 'completed').length;
            const tPct = msTasksTotal > 0 ? (msTasksCompleted / msTasksTotal) * 100 : null;

            const qPct = (ms.has_quantity && ms.target_quantity > 0) 
              ? (ms.current_quantity / ms.target_quantity) * 100 
              : null;

            let msProgress = 0;
            if (qPct !== null && tPct !== null) {
              msProgress = Math.round((qPct + tPct) / 2);
            } else if (qPct !== null) {
              msProgress = Math.round(qPct);
            } else if (tPct !== null) {
              msProgress = Math.round(tPct);
            }

            msProgress = Math.min(100, msProgress);

            if (totalPhaseWeight > 0) {
              phaseWeightedProgress += msProgress * (parseFloat(ms.weight_percentage || 0) / totalPhaseWeight);
            } else if (phaseMilestones.length > 0) {
              phaseWeightedProgress += msProgress * (1 / phaseMilestones.length);
            }

            return {
              id: ms.id,
              milestone_name: ms.milestone_name,
              weight_percentage: parseFloat(ms.weight_percentage || 0),
              progress_percentage: msProgress
            };
          });

          return {
            id: phase.id,
            phase_key: phase.phase_key,
            progress: Math.round(phaseWeightedProgress),
            milestones: mappedMilestones
          };
        });

        const totalProjectWeight = (projectPhases || []).reduce((acc, p) => acc + parseFloat(p.weight_percentage || 0), 0);
        let projectProgress = 0;

        if (totalProjectWeight > 0) {
          projectProgress = result.reduce((acc, phase) => {
            const phaseData = projectPhases.find(p => p.id === phase.id);
            const weight = parseFloat(phaseData?.weight_percentage || 0);
            return acc + (phase.progress * (weight / totalProjectWeight));
          }, 0);
        } else if (result.length > 0) {
          projectProgress = result.reduce((acc, phase) => acc + phase.progress, 0) / result.length;
        }

        return {
          phases: result,
          project_progress: Math.round(projectProgress)
        };
      };
      
      const projectTeams = ongoingItems.map((project) => {
        const progressData = getProgressForProject(project.id, project.tasks || []);
        const tasksDone = project.tasks?.filter(t => t.status === 'completed').length || 0;
        const tasksTotal = project.tasks?.length || 0;
 
        // Create colorful segments for each completed task
        const taskSegments = [];
        if (tasksTotal > 0) {
          const segmentWidth = 100 / tasksTotal;
          for (let i = 0; i < tasksDone; i++) {
            taskSegments.push({
              color: colorPalette[i % colorPalette.length],
              percentage: segmentWidth
            });
          }
        }
 
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
          return { initials, color: avatarColors[idx % avatarColors.length] };
        });
 
        const picName = project.project_in_charge 
          ? [project.project_in_charge.first_name, project.project_in_charge.middle_name, project.project_in_charge.last_name, project.project_in_charge.suffix].filter(Boolean).join(' ')
          : 'Unassigned';
 
        return {
          project_id: project.id,
          project_name: project.project_code ? `${project.project_code} / ${project.project_name}` : project.project_name,
          location: project.address || 'No Location',
          engr_name: picName,
          tasksDone,
          tasksTotal,
          progress: progressData.project_progress,
          milestone_segments: taskSegments,
          memberCount: mappedMembers.length + (project.project_in_charge ? 1 : 0),
          members: formattedMembers
        };
      });
 
      // 3. Ongoing Projects details
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const ongoingProjectsList = [...ongoingItems]
        .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
        .map((project) => {
          const progressData = getProgressForProject(project.id, project.tasks || []);
          const progress = progressData.project_progress;
          
          let daysLeft = null;
          let displayStatus = 'On Track';
          
          if (project.end_date) {
            const endDate = new Date(project.end_date);
            const diffTime = Math.max(0, endDate - currentDate);
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          let hasDelayedMilestoneOrPhase = false;
          const projectPhases = phasesByProject.get(project.id) || [];
          
          projectPhases.forEach(phase => {
            const phaseProgressData = progressData.phases.find(p => p.id === phase.id);
            const isPhaseComplete = phaseProgressData && phaseProgressData.progress === 100;

            if (!isPhaseComplete && phase.end_date) {
               const pEndDate = new Date(phase.end_date);
               pEndDate.setHours(23, 59, 59, 999);
               if (currentDate > pEndDate) hasDelayedMilestoneOrPhase = true;
            }

            (phase.milestones || []).forEach(ms => {
                const msProgressData = phaseProgressData?.milestones?.find(m => m.id === ms.id);
                const isMsComplete = msProgressData && msProgressData.progress_percentage === 100;
                
                if (!isMsComplete && ms.end_date) {
                   const mEndDate = new Date(ms.end_date);
                   mEndDate.setHours(23, 59, 59, 999);
                   if (currentDate > mEndDate) hasDelayedMilestoneOrPhase = true;
                }
            });
          });
 
          if (daysLeft !== null && daysLeft < 14 && progress < 100) {
            displayStatus = 'Near Due';
          }
          
          if ((daysLeft !== null && daysLeft <= 0 && progress < 100) || hasDelayedMilestoneOrPhase) {
            displayStatus = 'Delayed';
          }
 
          return {
            project_id: project.id,
            project_name: project.project_name,
            progress,
            daysLeft,
            status: displayStatus
          };
        });

      // 4. Project Updates Today
      const now = new Date();
      const todayUtc = now.toISOString().split('T')[0];
      const localNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const todayLocal = localNow.toISOString().split('T')[0];

      const updatesList = ongoingItems.map(project => {
        let updatesToday = 0;
        let latestLogTime = null;

        (project.updates || []).forEach(task => {
          (task.progress_logs || []).forEach(log => {
             const createdDate = log.created_at ? log.created_at.split('T')[0] : null;
             const workDate = log.work_date ? log.work_date.split('T')[0] : null;
             if (createdDate === todayUtc || createdDate === todayLocal || workDate === todayUtc || workDate === todayLocal) {
               updatesToday++;
               if (!latestLogTime || new Date(log.created_at) > new Date(latestLogTime.created_at)) {
                 latestLogTime = log;
               }
             }
          });
        });

        let latestShift = 'Morning';
        if (latestLogTime) {
            if (latestLogTime.shift) {
                latestShift = latestLogTime.shift;
            } else {
                const h = new Date(latestLogTime.created_at).getHours();
                if (h < 12) latestShift = 'Morning';
                else if (h < 14) latestShift = 'Noon';
                else latestShift = 'Afternoon';
            }
        }

        return {
          project_id: project.id,
          project_name: project.project_name,
          updates_today: updatesToday,
          latest_shift: latestShift
        };
      })
      .filter(p => p.updates_today > 0)
      .sort((a, b) => b.updates_today - a.updates_today);

      res.json({
        ongoing_projects_count: ongoingCount,
        proposed_projects_count: proposedCount,
        completed_projects_count: completedCount,
        project_teams: projectTeams,
        ongoing_projects: ongoingProjectsList,
        project_updates: updatesList
      });

    } catch (err) {
      console.error('Dashboard Stats Error:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }
}

module.exports = DashboardController;
