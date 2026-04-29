const { createClient } = require('@supabase/supabase-js');
const MilestoneService = require('../services/MilestoneService');

/**
 * ReportController - Handles complex construction report generation.
 */
class ReportController {
  
  static getSupabaseWithAuth(req) {
    const token = req.cookies?.['sb-access-token'];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }

  /**
   * Generates a comprehensive project assessment report for one or more projects.
   * POST /api/reports/generate
   */
  static async generate(req, res) {
    try {
      const supabase = ReportController.getSupabaseWithAuth(req);
      const { 
        projectIds,
        startDate, 
        endDate, 
        includeProgress,
        includeInventory,
        includeAccomplishments
      } = req.body;

      if (!projectIds || !Array.isArray(projectIds)) {
        return res.status(400).json({ message: 'projectIds must be an array' });
      }

      const reportData = [];

      for (const id of projectIds) {
        let projectData = null;
        let progress = null;
        let inventory = [];
        let accomplishments = [];
        let completedTasks = [];

        const projectIdInt = parseInt(id);

        // 1. Fetch Project Details
        const { data: project, error: pError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectIdInt)
          .single();
        
        if (pError) {
          console.error(`Error fetching project ${id}:`, pError);
          continue;
        }
        projectData = project;

        // 2. Fetch Progress/Milestones
        if (includeProgress) {
          try {
            const milestoneResult = await MilestoneService.getProjectMilestonesProgress(projectIdInt);
            progress = {
              phases: milestoneResult.phases,
              project_progress: milestoneResult.project_progress,
              schedule: 100 
            };
          } catch (e) {
            console.warn(`Progress fetch failed for project ${id}:`, e.message);
          }

          try {
            const { data: tasks, error: taskError } = await supabase
              .from('tasks')
              .select(`
                id,
                title,
                status,
                due_date,
                updated_at,
                assigned_to:users!assigned_to(first_name, last_name)
              `)
              .eq('project_id', projectIdInt)
              .eq('status', 'completed');
            
            if (!taskError) {
              completedTasks = tasks.map(t => ({
                id: t.id,
                title: t.title,
                taken_by: t.assigned_to ? `${t.assigned_to.first_name} ${t.assigned_to.last_name}` : 'Field Staff',
                date: t.updated_at ? t.updated_at.split('T')[0] : (t.due_date ? t.due_date.split('T')[0] : 'N/A')
              }));
            }
          } catch (e) {
            console.warn(`Tasks fetch failed for project ${id}:`, e.message);
          }
        }

        // 3. Fetch Inventory
        if (includeInventory) {
          try {
            const { data: invItems, error: invError } = await supabase
              .from('project_inventory_items')
              .select('*')
              .eq('project_id', projectIdInt);
            
            if (!invError) {
              inventory = invItems.map(item => ({
                id: item.id,
                item: item.item_name,
                category: item.category || 'Material',
                stock: item.current_stock || 0,
                minStock: item.critical_level || 0,
                price: item.price ? `₱${parseFloat(item.price).toLocaleString()}` : '₱0',
                status: (item.current_stock || 0) <= (item.critical_level || 0) ? 'Low Stock' : 'In Stock'
              }));
            }
          } catch (e) {
            console.warn(`Inventory fetch failed for project ${id}:`, e.message);
          }
        }

        // 4. Fetch Accomplishments (Photos/Logs)
        if (includeAccomplishments) {
          try {
            // We fetch all logs and filter in JS to be absolutely sure of data integrity
            // matching the logic in TaskProgressLogController
            const { data: logs, error: logError } = await supabase
              .from('task_progress_logs')
              .select(`
                *,
                creator:users!created_by(id, first_name, last_name),
                task:tasks!task_id(id, title, assigned_to:users!assigned_to(first_name, last_name)),
                milestone:project_milestones!milestone_id(id, project_id, milestone_name)
              `)
              .not('evidence_image_path', 'is', null)
              .order('created_at', { ascending: false });
            
            if (!logError && logs) {
              // Filter by project_id in JS
              const projectLogs = logs.filter(l => l.milestone && l.milestone.project_id === projectIdInt);
              
              const bucket = process.env.SUPABASE_BUCKET_PROGRESS || 'site-progress';
              const supabaseUrl = process.env.SUPABASE_URL;

              accomplishments = projectLogs.map(log => {
                let imageUrl = null;
                if (log.evidence_image_path) {
                  imageUrl = log.evidence_image_path.startsWith('http') 
                    ? log.evidence_image_path 
                    : `${supabaseUrl}/storage/v1/object/public/${bucket}/${log.evidence_image_path.replace(/^\/+/, '')}`;
                }

                return {
                  id: log.id,
                  date: log.work_date || (log.created_at ? log.created_at.split('T')[0] : null),
                  time: log.created_at ? log.created_at.split('T')[1].substring(0, 5) : null,
                  title: log.task?.title || 'Site Update',
                  notes: log.remarks || log.notes || 'Progress update recorded.',
                  image_url: imageUrl,
                  taken_by: log.creator ? `${log.creator.first_name} ${log.creator.last_name}` : 'Field Staff',
                  quantity: log.quantity_accomplished,
                  milestone_name: log.milestone?.milestone_name
                };
              });
            } else if (logError) {
              console.error(`Accomplishments log error for project ${id}:`, logError);
            }
          } catch (e) {
            console.warn(`Accomplishments fetch failed for project ${id}:`, e.message);
          }
        }

        reportData.push({
          id: projectData.id,
          name: projectData.project_name,
          code: projectData.project_code,
          progress,
          inventory,
          accomplishments,
          completedTasks
        });
      }

      res.json({
        reportData,
        config: {
          startDate,
          endDate,
          includeProgress,
          includeInventory,
          includeAccomplishments
        }
      });

    } catch (error) {
      console.error('Report Generation Error:', error);
      res.status(500).json({ message: 'Internal server error during report compilation', error: error.message });
    }
  }
}

module.exports = ReportController;
