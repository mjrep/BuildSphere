<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Enums\ProjectStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Get real-time project counts, teams, ongoing tasks, and updates.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $cacheKey = 'dashboard_stats_' . $user->id;

        $stats = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($user) {
            $baseQuery = Project::visibleTo($user);

            // 1. Stats Counter
            $ongoingCount = (clone $baseQuery)->where('status', ProjectStatus::ONGOING)->count();
            $proposedCount = (clone $baseQuery)->where('status', ProjectStatus::PROPOSED)->count();
            $completedCount = (clone $baseQuery)->where('status', ProjectStatus::COMPLETED)->count();

            // 2. Project Teams (4 most recent ongoing)
            $teamsQuery = (clone $baseQuery)
                ->where('status', ProjectStatus::ONGOING)
                ->with(['projectInCharge', 'members'])
                ->withCount([
                    'tasks as tasks_total',
                    'tasks as tasks_done' => function ($query) {
                        $query->where('status', 'completed');
                    }
                ])
                ->latest()
                ->take(4)
                ->get();

            $colors = ['#706BFF', '#EC4899', '#10B981', '#F59E0B'];

            $projectTeams = $teamsQuery->map(function ($project) use ($colors) {
                $members = collect();
                if ($project->projectInCharge) {
                    $members->push($project->projectInCharge);
                }
                foreach ($project->members as $member) {
                    if ($members->count() < 4 && $member->id !== $project->project_in_charge_id) {
                         $members->push($member);
                    }
                }
                
                $formattedMembers = $members->map(function ($m, $index) use ($colors) {
                    $first = $m->first_name ?: ($m->name ?: 'U');
                    $last = $m->last_name ?: '';
                    $initials = strtoupper(substr($first, 0, 1) . substr($last, 0, 1));
                    return [
                        'initials' => $initials,
                        'color' => $colors[$index % count($colors)],
                    ];
                });

                return [
                    'project_name' => collect([$project->project_code, $project->project_name])->filter()->join(' / '),
                    'location' => $project->address ?? 'No Location',
                    'engr_name' => $project->projectInCharge?->name ?? 'Unassigned',
                    'tasksDone' => $project->tasks_done,
                    'tasksTotal' => $project->tasks_total,
                    'memberCount' => $project->members->count() + ($project->projectInCharge ? 1 : 0),
                    'members' => $formattedMembers,
                ];
            });

            // 3. Ongoing Projects
            $ongoingQuery = (clone $baseQuery)
                ->where('status', ProjectStatus::ONGOING)
                ->withCount([
                    'tasks as tasks_total',
                    'tasks as tasks_done' => function ($query) {
                        $query->where('status', 'completed');
                    }
                ])
                ->orderBy('end_date', 'asc')
                ->take(3)
                ->get();

            $ongoingProjects = $ongoingQuery->map(function ($project) {
                $progress = $project->tasks_total > 0 ? round(($project->tasks_done / $project->tasks_total) * 100) : 0;
                $daysLeft = $project->end_date ? max(0, now()->diffInDays($project->end_date, false)) : 0;

                $status = 'On Track';
                if ($daysLeft < 14 && $progress < 80) {
                    $status = 'Near Due';
                }
                if ($daysLeft <= 0 && $progress < 100) {
                    $status = 'Delayed';
                }

                return [
                    'project_name' => $project->project_name,
                    'progress' => $progress,
                    'daysLeft' => intval($daysLeft),
                    'status' => $status,
                ];
            });

            // 4. Project Updates Today
            $today = now()->toDateString();
            $projectsWithUpdates = (clone $baseQuery)
                ->where('status', ProjectStatus::ONGOING)
                ->with(['tasks' => function($q) use ($today) {
                    $q->withCount(['progressLogs' => function($logQ) use ($today) {
                        $logQ->whereDate('created_at', $today)->orWhereDate('work_date', $today);
                    }]);
                }])
                ->get()
                ->map(function ($project) {
                    return [
                        'project_name' => $project->project_name,
                        'updates_today' => $project->tasks->sum('progress_logs_count')
                    ];
                })
                ->filter(fn($p) => $p['updates_today'] > 0)
                ->sortByDesc('updates_today')
                ->take(4)
                ->values();

            // Pad with empty projects if fewer than 4 to maintain UI layout
            $updatesList = collect($projectsWithUpdates);
            while ($updatesList->count() < 4) {
                $updatesList->push([
                    'project_name' => '—',
                    'updates_today' => 0
                ]);
            }

            return collect([
                'ongoing_projects_count'  => $ongoingCount,
                'proposed_projects_count' => $proposedCount,
                'completed_projects_count' => $completedCount,
                'project_teams' => $projectTeams,
                'ongoing_projects' => $ongoingProjects,
                'project_updates' => $updatesList->take(4),
            ])->toArray();
        });

        return response()->json($stats);
    }
}
