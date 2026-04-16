<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$project = App\Models\Project::first();
$phase = $project->phases->first();
$ms = App\Models\ProjectMilestone::find(14); // proc w quantity
$tasks = App\Models\Task::where('milestone_id', $ms->id)->get();

echo "Target Quantity: " . $ms->target_quantity . "\n";
echo "Current Quantity: " . $ms->current_quantity . "\n";
$msProgress = round(($ms->current_quantity / $ms->target_quantity) * 100);
echo "Milestone Progress (Index formula): " . $msProgress . "%\n";

echo "Task 20 status: " . $tasks->where('id', 20)->first()->status . "\n";
