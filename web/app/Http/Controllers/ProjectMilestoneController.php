<?php

namespace App\Http\Controllers;

use App\Enums\ProjectPhaseTitle;
use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectMilestonePlanRequest;
use App\Models\Project;
use App\Services\ProjectMilestoneChartService;
use App\Services\ProjectService;
use Illuminate\Http\Request;

class ProjectMilestoneController extends Controller
{
    public function __construct(
        private ProjectService $projectService,
        private ProjectMilestoneChartService $chartService,
    ) {}

    /**
     * GET /api/projects/{project}/milestones
     * Returns flat list of milestones with progress and status.
     */
    public function index(Project $project)
    {
        $project->load([
            'phases.milestones',
            'phases.tasks.assignedTo',
            'phases.tasks.assignedBy',
            'phases.tasks.milestone'
        ]);

        $data = $project->phases->map(function ($phase) {
            $tasks = $phase->tasks->map(function ($task) {
                return [
                    'id'               => $task->id,
                    'milestone_id'     => $task->milestone_id,
                    'milestone_name'   => $task->milestone ? $task->milestone->milestone_name : 'No Milestone',
                    'title'            => $task->title,
                    'assigned_to_name' => $task->assignedTo ? $task->assignedTo->first_name . ' ' . $task->assignedTo->last_name : 'Unassigned',
                    'given_by_name'    => $task->assignedBy ? $task->assignedBy->first_name . ' ' . $task->assignedBy->last_name : 'System',
                    'start_date'       => $task->start_date ? $task->start_date->format('m/d/Y') : null,
                    'end_date'         => $task->due_date ? $task->due_date->format('m/d/Y') : null,
                    'status'           => $task->status,
                ];
            });

            $totalTasks = $tasks->count();
            $completedTasks = $tasks->where('status', 'completed')->count();

            // Calculate milestone-based progress for the phase
            $totalPhaseWeight = $phase->milestones->sum('weight_percentage');
            $phaseWeightedProgress = 0;

            $milestones = $phase->milestones->map(function($ms) use ($tasks, &$phaseWeightedProgress, $totalPhaseWeight, $phase) {
                if ($ms->has_quantity && $ms->target_quantity > 0) {
                    $msProgress = round(($ms->current_quantity / $ms->target_quantity) * 100);
                } else {
                    $msTasksTotal = $tasks->where('milestone_id', $ms->id)->count();
                    $msTasksCompleted = $tasks->where('milestone_id', $ms->id)->where('status', 'completed')->count();
                    $msProgress = $msTasksTotal > 0 ? round(($msTasksCompleted / $msTasksTotal) * 100) : 0;
                }
                
                $msProgress = min(100, $msProgress);

                if ($totalPhaseWeight > 0) {
                    $phaseWeightedProgress += $msProgress * ($ms->weight_percentage / $totalPhaseWeight);
                } else if ($phase->milestones->count() > 0) {
                    $phaseWeightedProgress += $msProgress * (1 / $phase->milestones->count());
                }

                return [
                    'id'                  => $ms->id,
                    'title'               => $ms->milestone_name,
                    'start_date'          => $ms->start_date->format('Y-m-d'),
                    'end_date'            => $ms->end_date->format('Y-m-d'),
                    'weight_percentage'   => (float) $ms->weight_percentage,
                    'progress_percentage' => $msProgress,
                ];
            });

            return [
                'id'          => $phase->id,
                'name'        => $phase->phase_title,
                'progress'    => round($phaseWeightedProgress),
                'completed_tasks_count' => $completedTasks,
                'total_tasks_count'     => $totalTasks,
                'milestones'  => $milestones,
                'tasks' => $tasks
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/projects/{project}/milestone-plan
     * Returns phases + milestones for editing.
     */
    public function getMilestonePlan(Project $project)
    {
        $project->load(['phases.milestones']);

        $phases = $project->phases->map(fn ($phase) => [
            'id'                => $phase->id,
            'phase_key'         => $phase->phase_key,
            'phase_title'       => $phase->phase_title,
            'weight_percentage' => (float) $phase->weight_percentage,
            'start_date'        => $phase->start_date->format('Y-m-d'),
            'end_date'          => $phase->end_date->format('Y-m-d'),
            'sequence_no'       => $phase->sequence_no,
            'milestones'        => $phase->milestones->map(fn ($ms) => [
                'id'              => $ms->id,
                'milestone_name'  => $ms->milestone_name,
                'weight_percentage' => (float) $ms->weight_percentage,
                'start_date'      => $ms->start_date->format('Y-m-d'),
                'end_date'        => $ms->end_date->format('Y-m-d'),
                'has_quantity'    => (bool) $ms->has_quantity,
                'quantity_target' => $ms->target_quantity ? (int) $ms->target_quantity : null,
                'current_quantity'=> (int) $ms->current_quantity,
                'unit_of_measure' => $ms->unit_of_measure,
                'sequence_no'     => $ms->sequence_no,
            ]),
        ]);

        return response()->json([
            'project_id'   => $project->id,
            'project_name' => $project->project_name,
            'status'       => $project->status->value,
            'sub_status'   => $project->sub_status?->value,
            'is_editable'  => $project->isEditable(),
            'phases'        => $phases,
        ]);
    }

    /**
     * POST /api/projects/{project}/milestone-plan
     * Saves draft — does NOT change project status.
     */
    public function storeMilestonePlan(StoreProjectMilestonePlanRequest $request, Project $project)
    {
        $updated = $this->projectService->saveMilestonePlan(
            $project,
            $request->validated()['phases'],
            $request->user()
        );

        return response()->json([
            'message' => 'Milestone plan saved.',
        ]);
    }

    /**
     * GET /api/projects/{project}/milestone-chart
     * Returns dynamically derived chart payload.
     */
    public function getMilestoneChart(Project $project)
    {
        return response()->json(
            $this->chartService->buildChartPayload($project)
        );
    }

    /**
     * POST /api/projects/{project}/milestone-submit
     * Finalizes plan and transitions status.
     */
    public function submitMilestoneReview(Request $request, Project $project)
    {
        $user = $request->user();

        if ($user->role !== 'Project Engineer') {
            return response()->json(['message' => 'Only Project Engineers can submit milestone plans.'], 403);
        }

        if (!$project->isEditable()) {
            return response()->json([
                'message' => 'Milestone plan can only be submitted for projects in Proposed (Draft or For Revision) status.',
            ], 422);
        }

        // Ensure phases exist
        if ($project->phases()->count() === 0) {
            return response()->json([
                'message' => 'Please save a milestone plan before submitting.',
            ], 422);
        }

        $this->projectService->submitMilestonePlan($project, $user);

        return response()->json([
            'message' => 'Milestone plan submitted for approval.',
        ]);
    }

    /**
     * GET /api/phase-titles
     * Returns allowed phase title options for frontend dropdown.
     */
    public function phaseTitles()
    {
        return response()->json(ProjectPhaseTitle::options());
    }
}
