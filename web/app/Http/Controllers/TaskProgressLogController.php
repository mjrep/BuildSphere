<?php

namespace App\Http\Controllers;

use App\Models\ProjectMilestone;
use App\Models\Task;
use App\Models\TaskProgressLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TaskProgressLogController extends Controller
{
    /**
     * GET /api/projects/{project}/progress-logs
     *
     * Fetch all progress logs for a given project, optionally filtered
     * by task_id. Eager-loads the creator relationship and returns
     * full public URLs for evidence images.
     */
    public function index(Request $request, int $project): JsonResponse
    {
        $query = TaskProgressLog::with([
            'creator:id,first_name,last_name',
            'task:id,title',
            'milestone:id,milestone_name,current_quantity,target_quantity,unit_of_measure',
        ])
            ->whereHas('milestone', fn ($q) => $q->where('project_id', $project))
            ->orderByDesc('created_at');

        // Optional: filter to a specific task
        if ($request->filled('task_id')) {
            $query->where('task_id', $request->input('task_id'));
        }

        $logs = $query->get();

        return response()->json([
            'data' => $logs->map(fn (TaskProgressLog $log) => $this->formatLog($log)),
        ]);
    }

    /**
     * POST /api/task-progress-logs
     *
     * Store a new site-update / progress log.
     * Wraps all DB writes in a transaction so milestone + task
     * stay in sync even if something fails midway.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id'                => 'required|exists:tasks,id',
            'quantity_accomplished'  => 'required|integer|min:1',
            'evidence_image'        => 'nullable|image|max:10240', // 10 MB
            'remarks'               => 'nullable|string|max:2000',
        ]);

        // ── Resolve parent entities ────────────────────────────────────
        $task      = Task::findOrFail($validated['task_id']);
        $milestone = $task->milestone;

        // Guard: milestone must exist and support quantity tracking
        if (!$milestone || !$milestone->has_quantity) {
            return response()->json([
                'message' => 'The parent milestone does not support quantity tracking.',
            ], 422);
        }

        // ── Overflow Guard ─────────────────────────────────────────────
        // Prevent logging more than what remains of the target quantity.
        $remaining = $milestone->target_quantity - $milestone->current_quantity;

        if ($validated['quantity_accomplished'] > $remaining) {
            return response()->json([
                'message' => "Quantity exceeds remaining target. Only {$remaining} glass panels left.",
                'remaining' => $remaining,
            ], 422);
        }

        // ── Transaction: create log → update milestone → update task ──
        $log = DB::transaction(function () use ($request, $validated, $task, $milestone) {

            // 1. Handle optional evidence image upload
            $imagePath = null;
            if ($request->hasFile('evidence_image')) {
                // Store to Supabase in the specified progress bucket
                $imagePath = $request->file('evidence_image')
                    ->store('', [
                        'disk' => 'supabase',
                        'bucket' => env('SUPABASE_BUCKET_PROGRESS', 'site-progress')
                    ]);
            }

            // 2. Create the progress log record
            $log = TaskProgressLog::create([
                'task_id'                => $task->id,
                'milestone_id'          => $milestone->id,
                'created_by'            => $request->user()->id,
                'quantity_accomplished'  => $validated['quantity_accomplished'],
                'evidence_image_path'   => $imagePath,
                'remarks'               => $validated['remarks'] ?? null,
                'ai_verification_status' => 'for_checking',
                'work_date'             => $request->input('work_date', now()->toDateString()),
                'shift'                 => $request->input('shift', 'Morning'),
            ]);

            // 3. Reconciliation — ensure milestone and task are in sync
            $this->reconcileProgress($task, $milestone);

            return $log;
        });

        // ── Eager-load for response ────────────────────────────────────
        $log->load([
            'task:id,title,status',
            'milestone:id,milestone_name,current_quantity,target_quantity,unit_of_measure',
            'creator:id,first_name,last_name',
        ]);

        return response()->json([
            'message' => 'Progress log saved.',
            'data'    => $this->formatLog($log),
        ], 201);
    }

    /**
     * PATCH /api/progress-logs/{id}
     * Allow project in charge / Admin to update status or quantity.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $log = TaskProgressLog::findOrFail($id);
        $task = $log->task;
        $project = $task->project;

        // 1. Authorization: Project in charge, CEO, COO, or Admin
        $user = $request->user();
        $userRole = str_replace(' ', '_', strtolower($user->role));
        $isAuthorized = (
            $project->project_in_charge_id === $user->id ||
            in_array($userRole, ['ceo', 'coo', 'admin'])
        );

        if (!$isAuthorized) {
            return response()->json(['message' => 'Unauthorized. Only the Project in Charge or Executives can verify updates.'], 403);
        }

        $validated = $request->validate([
            'quantity_accomplished'  => 'integer|min:0',
            'ai_verification_status' => 'string|in:for_checking,approved',
        ]);

        DB::transaction(function () use ($log, $validated, $task) {
            $log->update($validated);
            
            // 2. Reconciliation
            $this->reconcileProgress($task, $task->milestone);
        });

        return response()->json([
            'message' => 'Progress log updated.',
            'data'    => $this->formatLog($log->refresh()->load(['creator', 'milestone', 'task'])),
        ]);
    }

    /**
     * Re-calculate totals for milestone and task to ensure data integrity.
     */
    private function reconcileProgress($task, $milestone)
    {
        if (!$milestone || !$milestone->has_quantity) return;

        // 1. milestone.current_quantity = sum of ALL logs for this milestone
        $totalMilestone = TaskProgressLog::where('milestone_id', $milestone->id)->sum('quantity_accomplished');
        $milestone->update([
            'current_quantity' => min($totalMilestone, $milestone->target_quantity)
        ]);

        // 2. task.status logic
        $taskProgress = $task->progressLogs()->sum('quantity_accomplished');
        $isTaskDone   = $taskProgress >= $milestone->target_quantity;

        // If it was already completed, don't move it back unless progress dropped
        if ($task->status === 'completed' && !$isTaskDone) {
            $task->status = 'in_progress';
        } elseif ($task->status !== 'completed') {
            $task->status = $isTaskDone ? 'in_review' : ($taskProgress > 0 ? 'in_progress' : 'todo');
        }

        $task->save();
        
        // Invalidate the task list caches globally using the new versioning strategy
        Cache::increment('tasks_list_version');
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Format a single log for JSON response.
     * Returns the full public URL for evidence images.
     */
    private function formatLog(TaskProgressLog $log): array
    {
        // Build full public URL for the evidence image
        $imageUrl = null;
        if ($log->evidence_image_path) {
            if (filter_var($log->evidence_image_path, FILTER_VALIDATE_URL)) {
                $imageUrl = $log->evidence_image_path;
            } else {
                $imageUrl = sprintf(
                    '%s/storage/v1/object/public/%s/%s',
                    env('SUPABASE_URL'),
                    env('SUPABASE_BUCKET_PROGRESS', 'site-progress'),
                    ltrim($log->evidence_image_path, '/')
                );
            }
        }

        return [
            'id'                     => $log->id,
            'task_id'                => $log->task_id,
            'milestone_id'           => $log->milestone_id,
            'task'                   => $log->task ? [
                'id'    => $log->task->id,
                'title' => $log->task->title,
            ] : null,
            'quantity_accomplished'  => $log->quantity_accomplished,
            'evidence_image_url'     => $imageUrl,
            'remarks'                => $log->remarks,
            'ai_verification_status' => $log->ai_verification_status,
            'milestone'              => $log->milestone ? [
                'id'               => $log->milestone->id,
                'name'             => $log->milestone->milestone_name,
                'current_quantity' => $log->milestone->current_quantity,
                'target_quantity'  => $log->milestone->target_quantity,
                'unit_of_measure'  => $log->milestone->unit_of_measure,
            ] : null,
            'created_by'             => $log->creator ? [
                'id'   => $log->creator->id,
                'name' => $log->creator->first_name . ' ' . $log->creator->last_name,
            ] : null,
            'work_date'              => $log->work_date?->toDateString(),
            'shift'                  => $log->shift,
            'created_at'             => $log->created_at?->toIso8601String(),
        ];
    }
}
