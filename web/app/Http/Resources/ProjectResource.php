<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysLeft = $this->end_date ? \Carbon\Carbon::now()->diffInDays($this->end_date, false) : null;
        $statusMetric = 'on_track';
        if ($this->end_date && $daysLeft < 0 && $this->status !== \App\Enums\ProjectStatus::COMPLETED) {
            $statusMetric = 'delayed';
        } elseif ($this->end_date && $daysLeft <= 14 && $daysLeft >= 0 && $this->status !== \App\Enums\ProjectStatus::COMPLETED) {
            $statusMetric = 'near_due';
        }

        $tasksCompleted = $this->relationLoaded('tasks') ? $this->tasks->where('status', 'completed')->count() : 0;
        $tasksTotal = $this->relationLoaded('tasks') ? $this->tasks->count() : 0;

        $progress = 0;
        // Fallback to task-based progress if no milestone engine value is pre-calculated from a dedicated service
        if ($tasksTotal > 0) {
            $progress = round(($tasksCompleted / $tasksTotal) * 100);
        }

        return [
            'id'                  => $this->id,
            'project_code'        => $this->project_code,
            'project_name'        => $this->project_name,
            'client_name'         => $this->client_name,
            'address'             => $this->address,
            'description'         => $this->description,
            'contract_price'      => (float) $this->contract_price,
            'contract_unit_price' => $this->contract_unit_price ? (float) $this->contract_unit_price : null,
            'budget_for_materials'=> $this->budget_for_materials ? (float) $this->budget_for_materials : null,
            'start_date'          => $this->start_date?->format('Y-m-d'),
            'end_date'            => $this->end_date?->format('Y-m-d'),
            'status'              => $this->status->value,
            'status_label'        => $this->status->label(),
            'status_badge_label'  => $this->status->badgeLabel(),
            'status_badge_color'  => $this->status->badgeColor(),

            'sub_status'              => $this->sub_status?->value,
            'sub_status_label'        => $this->sub_status?->label(),
            'sub_status_badge_color'  => $this->sub_status?->badgeColor(),
            'is_editable'         => $this->isEditable(),

            // Relationships
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id'   => $this->creator->id,
                'name' => $this->creator->first_name . ' ' . $this->creator->last_name,
            ]),
            'project_in_charge' => $this->whenLoaded('projectInCharge', fn () => $this->projectInCharge ? [
                'id'   => $this->projectInCharge->id,
                'name' => $this->projectInCharge->first_name . ' ' . $this->projectInCharge->last_name,
            ] : null),

            // Counts
            'milestones_count' => $this->whenCounted('milestones'),

            // Timestamps
            'created_at' => $this->created_at?->format('m/d/Y'),
            'updated_at' => $this->updated_at?->toISOString(),

            // Approval info
            'rejection_reason' => $this->rejection_reason,
            'accounting_approved_at' => $this->accounting_approved_at?->toISOString(),
            'executive_approved_at'  => $this->executive_approved_at?->toISOString(),

            // Overview Data
            'status_metrics' => [
                'status' => $statusMetric,
                'days_left' => $daysLeft !== null ? abs((int)$daysLeft) : null,
                'is_delayed' => $daysLeft !== null && $daysLeft < 0,
            ],
            'progress' => $progress,
            'tasks_summary' => [
                'completed' => $tasksCompleted,
                'total' => $tasksTotal,
            ],
            'cost_data' => [
                'planned' => $this->budget_for_materials ? (float) $this->budget_for_materials : 0,
                'actual' => 0, // MOCKED UNTIL INVENTORY MODULE
            ],

            'team_members' => $this->whenLoaded('members', fn() => $this->members->map(function($m) {
                return [
                    'id' => $m->id,
                    'name' => $m->first_name . ' ' . $m->last_name,
                    'role' => $m->role, // user's job role
                    'role_in_project' => $m->pivot->role_in_project,
                    'initials' => strtoupper(substr($m->first_name, 0, 1) . substr($m->last_name, 0, 1)),
                ];
            })),

            'recent_project_files' => $this->whenLoaded('projectFiles', fn() => $this->projectFiles->map(function($f) {
                return [
                    'id' => $f->id,
                    'file_name' => $f->file_name,
                    'file_type' => $f->file_type,
                    'file_size' => $f->file_size,
                    'uploaded_by' => $f->uploadedBy ? $f->uploadedBy->first_name . ' ' . $f->uploadedBy->last_name : null,
                    'uploaded_at_human' => $f->created_at->diffForHumans(),
                ];
            })),

            'recent_activities' => $this->whenLoaded('activityLogs', fn() => $this->activityLogs->map(function($a) {
                return [
                    'id' => $a->id,
                    'action' => $a->action,
                    'description' => $a->description,
                    'user_name' => $a->user ? $a->user->first_name . ' ' . $a->user->last_name : 'System',
                    'created_at_human' => $a->created_at->diffForHumans(),
                    'created_at_date' => $a->created_at->format('l, F j'),
                ];
            })),
        ];
    }
}
