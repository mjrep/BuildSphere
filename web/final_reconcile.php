<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TaskProgressLog;
use App\Models\ProjectMilestone;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

echo "Starting Manual Data Repair and Reconciliation...\n";

DB::transaction(function() {
    // 1. Fix Log 8 (The "3 Panels" log that was accidentally pointed at a non-quantifiable milestone)
    $log8 = TaskProgressLog::find(8);
    if ($log8) {
        $targetMilestoneId = 14; 
        $task = Task::where('milestone_id', $targetMilestoneId)->first();
        
        if ($task) {
            $log8->update([
                'milestone_id' => $targetMilestoneId,
                'task_id' => $task->id
            ]);
            echo "Moved Log 8 to Milestone 14 (Procurement With quantity 5) and Task {$task->id}\n";
        }
    }

    // 2. Reconcile ALL Quantifiable Milestones
    $milestones = ProjectMilestone::where('has_quantity', true)->get();
    foreach ($milestones as $m) {
        $total = TaskProgressLog::where('milestone_id', $m->id)->sum('quantity_accomplished');
        $m->update(['current_quantity' => min($total, $m->target_quantity)]);
        echo "Milestone '{$m->milestone_name}': Progress updated to {$m->current_quantity}/{$m->target_quantity}\n";

        // Update related Task status
        $task = Task::where('milestone_id', $m->id)->first();
        if ($task) {
            $taskTotal = TaskProgressLog::where('task_id', $task->id)->sum('quantity_accomplished');
            $done = $taskTotal >= $m->target_quantity;
            
            if ($task->status !== 'completed') {
                $task->status = $done ? 'in_review' : ($taskTotal > 0 ? 'in_progress' : 'todo');
            }
            $task->save();
            echo "Task '{$task->title}': New Status -> {$task->status}, Progress -> {$taskTotal}\n";
        }
    }
});

echo "\nSynchronization and Data Repair Complete.\n";
