const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('Verifying Dashboard Milestone Aggregation...');
  
  const { data: rawProjects, error } = await supabase
    .from('projects')
    .select(`
      id, project_name, status,
      tasks:tasks(id, status, milestone_id)
    `)
    .eq('status', 'ongoing')
    .limit(4);

  if (error) {
    console.error('Fetch Error:', error);
    return;
  }

  rawProjects.forEach(project => {
    console.log(`\nProject: ${project.project_name}`);
    const tasksTotal = project.tasks?.length || 0;
    
    const tasksByMilestone = {};
    (project.tasks || []).forEach(t => {
      const mid = t.milestone_id || 'unassigned';
      if (!tasksByMilestone[mid]) tasksByMilestone[mid] = { total: 0, completed: 0 };
      tasksByMilestone[mid].total++;
      if (t.status === 'completed') tasksByMilestone[mid].completed++;
    });

    const milestoneSegments = Object.keys(tasksByMilestone).map((mid, idx) => {
      const mData = tasksByMilestone[mid];
      const widthPercent = tasksTotal > 0 ? (mData.completed / tasksTotal) * 100 : 0;
      
      return {
        milestone_id: mid,
        percentage: widthPercent
      };
    }).filter(s => s.percentage > 0);

    console.log('Milestone Segments:', milestoneSegments);
  });
}

verify();
