<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Enums\ProjectSubStatus;
use App\Http\Requests\CreateProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        private ProjectService $projectService
    ) {}

    /**
     * GET /projects — list projects with search, filter, sort, pagination.
     */
    public function index(Request $request)
    {
        $query = Project::with(['creator', 'projectInCharge'])
            ->withCount('milestones');

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by sub_status
        if ($request->filled('sub_status')) {
            $query->bySubStatus($request->sub_status);
        }

        // Filter by creator
        if ($request->filled('created_by')) {
            $query->createdByUser($request->created_by);
        }

        // Sorting
        $sortField = match ($request->input('sort')) {
            'oldest'     => ['created_at', 'asc'],
            'start_date' => ['start_date', 'asc'],
            'end_date'   => ['end_date', 'asc'],
            default      => ['created_at', 'desc'], // newest
        };
        $query->orderBy($sortField[0], $sortField[1]);

        $projects = $query->paginate($request->input('per_page', 12));

        return ProjectResource::collection($projects);
    }

    /**
     * POST /projects — create a new project.
     */
    public function store(CreateProjectRequest $request)
    {
        $project = $this->projectService->createProject(
            $request->validated(),
            $request->user()
        );

        $project->load(['creator', 'projectInCharge']);

        return new ProjectResource($project);
    }

    /**
     * GET /projects/{project} — show a single project.
     */
    public function show(Project $project)
    {
        $project->load([
            'creator',
            'projectInCharge',
            'milestones.creator',
            'approvals.approver',
            'members',
            'tasks',
        ]);

        // Limit the heavy relationships so the API response doesn't get huge
        $project->load(['activityLogs' => function ($query) {
            $query->with('user')->orderByDesc('created_at')->limit(10);
        }]);

        $project->load(['projectFiles' => function ($query) {
            $query->with('uploadedBy')->orderByDesc('created_at')->limit(5);
        }]);

        $project->loadCount('milestones');

        return new ProjectResource($project);
    }

    /**
     * POST /projects/{project}/team — add a user to the project team.
     */
    public function addTeamMember(Request $request, Project $project)
    {
        if (!in_array($request->user()->role, ['CEO', 'COO', 'HR'])) {
            return response()->json(['message' => 'Not authorized to manage project team.'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_in_project' => 'nullable|string|max:100',
        ]);

        if ($project->members()->where('user_id', $validated['user_id'])->exists()) {
            return response()->json(['message' => 'User is already a member of this project.'], 422);
        }

        $project->members()->attach($validated['user_id'], [
            'role_in_project' => $validated['role_in_project'] ?? null,
            'assigned_by' => $request->user()->id,
        ]);

        // Optional: log to project activity
        \App\Models\ProjectActivityLog::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'action' => 'TEAM_MEMBER_ADDED',
            'description' => "Added regular user ID {$validated['user_id']} to the team.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Team member added successfully.']);
    }

    /**
     * PUT /projects/{project} — update project details.
     */
    public function update(UpdateProjectRequest $request, Project $project)
    {
        $project->update($request->validated());
        $project->load(['creator', 'projectInCharge']);

        return new ProjectResource($project);
    }

    /**
     * DELETE /projects/{project} — soft-delete.
     */
    public function destroy(Request $request, Project $project)
    {
        if ($request->user()->role !== 'Sales' || !$project->isProposed()) {
            return response()->json(['message' => 'Not authorized to delete this project.'], 403);
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    /**
     * GET /project-statuses — return all statuses with labels.
     */
    public function statuses()
    {
        $statuses = collect(ProjectStatus::cases())->map(fn ($s) => [
            'value'       => $s->value,
            'label'       => $s->label(),
            'badge_label' => $s->badgeLabel(),
            'badge_color' => $s->badgeColor(),
        ]);

        $subStatuses = collect(ProjectSubStatus::cases())->map(fn ($s) => [
            'value'       => $s->value,
            'label'       => $s->label(),
            'badge_color' => $s->badgeColor(),
        ]);

        return response()->json([
            'main' => $statuses,
            'sub'  => $subStatuses,
        ]);
    }
}
