<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TaskProgressLog;
use App\Models\ProjectMilestone;

$logs = TaskProgressLog::all();
echo "Log ID | Milestone ID | Quantity | Created At\n";
foreach ($logs as $log) {
    echo "{$log->id} | {$log->milestone_id} | {$log->quantity_accomplished} | {$log->created_at}\n";
}

$milestones = ProjectMilestone::all();
echo "\nMilestone ID | Milestone Name\n";
foreach ($milestones as $m) {
    echo "{$m->id} | {$m->milestone_name}\n";
}
