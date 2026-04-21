const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('Verifying Hybrid Milestone Progress calculation...');
  
  // Test case based on user report:
  // PRJ-2026-0004
  // Phase EXECUTION
  // Milestone 16 (Quantifiable: 5/5 = 100%)
  // Tasks (2/3 = 67%)
  // Combined progress should be (100 + 67) / 2 = 83.5 -> 84%
  
  const projectId = 9; // PRJ-2026-0004
  const { data: phases, error } = await supabase
    .from('project_phases')
    .select(`
      id, phase_key,
      milestones:project_milestones(*),
      tasks:tasks(*)
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Fetch Error:', error);
    return;
  }

  phases.forEach(phase => {
    console.log(`\nPhase: ${phase.phase_key}`);
    const tasks = phase.tasks || [];
    
    phase.milestones.forEach(ms => {
      const msTasks = tasks.filter(t => t.milestone_id === ms.id);
      const msTasksTotal = msTasks.length;
      const msTasksCompleted = msTasks.filter(t => t.status === 'completed').length;
      const tPct = msTasksTotal > 0 ? (msTasksCompleted / msTasksTotal) * 100 : null;

      let msProgress = 0;
      let logicPath = '';
      if (ms.has_quantity && ms.target_quantity > 0) {
        const qPct = (ms.current_quantity / ms.target_quantity) * 100;
        if (tPct !== null) {
          msProgress = Math.round((qPct + tPct) / 2);
          logicPath = `Hybrid (Q: ${Math.round(qPct)}% + T: ${Math.round(tPct)}%) / 2`;
        } else {
          msProgress = Math.round(qPct);
          logicPath = `Quantity only (${Math.round(qPct)}%)`;
        }
      } else {
        msProgress = tPct !== null ? Math.round(tPct) : 0;
        logicPath = tPct !== null ? `Tasks only (${Math.round(tPct)}%)` : 'No metrics (0%)';
      }

      console.log(`- Milestone: ${ms.milestone_name}`);
      console.log(`  Progress: ${msProgress}% [${logicPath}]`);
      console.log(`  Tasks: ${msTasksCompleted}/${msTasksTotal}`);
    });
  });
}

verify();
