const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const MilestoneService = require('./MilestoneService');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Service for WPM-EVM (Weighted Progress-Earned Value Management) data aggregation.
 */
class EvmService {

  /**
   * Helper to compute days between two dates.
   */
  static _daysBetween(date1, date2) {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  static async getProjectEvmData(projectId) {
    if (!supabase) {
      throw new Error('Supabase client not initialized.');
    }

    // 1. Fetch overall Project Data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name, project_code, start_date, end_date, contract_price, budget_for_materials, status')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Failed to fetch project: ${projectError.message}`);
    }

    // 2. Fetch Phase/Milestone Data utilizing our proven Hybrid logic
    const phasesProgress = await MilestoneService.getProjectMilestonesProgress(projectId);

    // 3. Compute Dates
    const today = new Date().toISOString().split('T')[0];
    const startDate = project.start_date ? project.start_date.split('T')[0] : null;
    const endDate = project.end_date ? project.end_date.split('T')[0] : null;

    const plannedDurationDays = this._daysBetween(startDate, endDate);
    
    // Elapsed time calculation logic: 
    // If the project hasn't started, elapsed is 0. 
    // If it's done, elapsed is however long it actually took (or cap at end date).
    // Usually, elapsed time is evaluated against the current date.
    let elapsedProjectTimeDays = 0;
    if (startDate) {
        if (new Date(today) > new Date(startDate)) {
            elapsedProjectTimeDays = this._daysBetween(startDate, today);
        }
    }

    // 4. Compute Financials
    // Convert to strict floats. Budget for materials is primary prioritized metric.
    const budgetAtCompletion = parseFloat(project.budget_for_materials || 0);
    const contractPrice = parseFloat(project.contract_price || 0);

    // 5. Structure EVM Payload in snake_case format
    return {
      project_id: project.id,
      project_name: project.project_name,
      project_code: project.project_code,
      project_status: (project.status || '').toLowerCase(),
      timeline_metrics: {
        start_date: startDate,
        end_date: endDate,
        planned_duration_days: plannedDurationDays,
        elapsed_project_time_days: elapsedProjectTimeDays
      },
      financial_metrics: {
        budget_at_completion: budgetAtCompletion,
        contract_price: contractPrice
      },
      // Using data structure derived perfectly from MilestoneService
      phases: phasesProgress.map(phase => ({
        phase_id: phase.id,
        phase_name: phase.name,
        phase_weight_percentage: phase.milestones.reduce((sum, m) => sum + (parseFloat(m.weight_percentage) || 0), 0),
        phase_completion_percentage: phase.progress,
        milestones: phase.milestones.map(ms => ({
          milestone_id: ms.id,
          milestone_name: ms.milestone_name,
          weight_percentage: ms.weight_percentage,
          completion_percentage: ms.progress_percentage
        }))
      }))
    };
  }
}

module.exports = EvmService;
