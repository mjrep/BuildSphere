<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ProjectMilestone;
use App\Models\TaskProgressLog;
use App\Models\Task;

echo "Starting reconciliation...\n";

$milestones = ProjectMilestone::where('has_quantity', true)->get();

foreach ($milestones as $m) {
    echo "Reconciling Milestone: {$m->milestone_name} (ID: {$m->id})\n";
    
    // Sum all logs for this milestone
    $total = TaskProgressLog::where('milestone_id', $m->id)->sum('quantity_accomplished');
    $m->update(['current_quantity' => min($total, $m->target_quantity)]);
    
    // If there's a related task, reconcile it too
    $task = Task::where('milestone_id', $m->id)->first();
    if ($task) {
        echo "Updating Task: {$task->title}\n";
        $taskProgress = TaskProgressLog::where('task_id', $task->id)->sum('quantity_accomplished');
        $isTaskDone = $taskProgress >= $m->target_quantity;
        
        if ($task->status !== 'completed') {
            $task->status = $isTaskDone ? 'in_review' : ($taskProgress > 0 ? 'in_progress' : 'todo');
        }
        $task->save();
        echo "New Status: {$task->status}, Progress: {$taskProgress}\n";
    }
}

echo "Reconciliation complete.\n";
