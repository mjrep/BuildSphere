const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Service for Milestone operations.
 */
class MilestoneService {
  /**
   * Calculates the progress of milestones and phases for a project based on its tasks.
   */
  static async getProjectMilestonesProgress(projectId) {
    if (!supabase) {
      throw new Error('Supabase client not initialized.');
    }

    // Fetch Phases with nested Milestones and Tasks
    const { data: phases, error: phasesError } = await supabase
      .from('project_phases')
      .select(`
        id,
        phase_key,
        weight_percentage,
        milestones:project_milestones(
          id,
          milestone_name,
          start_date,
          end_date,
          weight_percentage,
          has_quantity,
          target_quantity,
          current_quantity
        ),
        tasks:tasks(
          id,
          milestone_id,
          title,
          start_date,
          due_date,
          status,
          assigned_to:users!assigned_to(first_name, last_name),
          assigned_by:users!assigned_by(first_name, last_name),
          milestone:project_milestones!milestone_id(milestone_name)
        )
      `)
      .eq('project_id', projectId);

    if (phasesError) throw phasesError;

    // Map and calculate progress for each phase
    const result = (phases || []).map((phase) => {
      // Format tasks to snake_case
      const tasks = (phase.tasks || []).map((task) => {
        const assignedToName = task.assigned_to 
          ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` 
          : 'Unassigned';
        const givenByName = task.assigned_by
          ? `${task.assigned_by.first_name} ${task.assigned_by.last_name}`
          : 'System';
        
        return {
          id: task.id,
          milestone_id: task.milestone_id,
          milestone_name: task.milestone ? task.milestone.milestone_name : 'No Milestone',
          title: task.title,
          assigned_to_name: assignedToName,
          given_by_name: givenByName,
          start_date: task.start_date ? task.start_date.split('T')[0] : null,
          end_date: task.due_date ? task.due_date.split('T')[0] : null,
          status: task.status
        };
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      const phaseMilestones = phase.milestones || [];
      const totalPhaseWeight = phaseMilestones.reduce((acc, curr) => acc + parseFloat(curr.weight_percentage || 0), 0);
      let phaseWeightedProgress = 0;

      // Calculate milestone progress
      const mappedMilestones = phaseMilestones.map((ms) => {
        const msTasks = tasks.filter(t => t.milestone_id === ms.id);
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

        // Add to phase weighted progress
        if (totalPhaseWeight > 0) {
          phaseWeightedProgress += msProgress * (parseFloat(ms.weight_percentage || 0) / totalPhaseWeight);
        } else if (phaseMilestones.length > 0) {
          phaseWeightedProgress += msProgress * (1 / phaseMilestones.length);
        }

        return {
          id: ms.id,
          milestone_name: ms.milestone_name,
          start_date: ms.start_date ? ms.start_date.split('T')[0] : null,
          end_date: ms.end_date ? ms.end_date.split('T')[0] : null,
          weight_percentage: parseFloat(ms.weight_percentage || 0),
          progress_percentage: msProgress
        };
      });

      // Helper to convert PREPARATION_PLANNING to Preparation & Planning
      const formatPhaseTitle = (key) => {
        const labels = {
          'PREPARATION_PLANNING': 'Preparation & Planning',
          'CLIENT_KICKOFF_MEETING': 'Client Kick-off Meeting',
          'PROCUREMENT': 'Procurement',
          'MOBILIZATION': 'Mobilization',
          'EXECUTION': 'Execution',
          'COMPLETION': 'Completion',
          'CLOSE_OUT': 'Close Out'
        };
        return labels[key] || key;
      };

      return {
        id: phase.id,
        name: formatPhaseTitle(phase.phase_key),
        phase_key: phase.phase_key,
        progress: Math.round(phaseWeightedProgress),
        completed_tasks_count: completedTasks,
        total_tasks_count: totalTasks,
        milestones: mappedMilestones,
        tasks: tasks
      };
    });

    // Calculate overall project progress based on phase weights
    const totalProjectWeight = (phases || []).reduce((acc, p) => acc + parseFloat(p.weight_percentage || 0), 0);
    let projectProgress = 0;

    if (totalProjectWeight > 0) {
      projectProgress = result.reduce((acc, phase) => {
        const phaseData = phases.find(p => p.id === phase.id);
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
  }
}

module.exports = MilestoneService;
