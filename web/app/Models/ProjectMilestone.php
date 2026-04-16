<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectMilestone extends Model
{
    protected $fillable = [
        'project_id',
        'project_phase_id',
        'milestone_name',
        'start_date',
        'end_date',
        'weight_percentage',
        'target_quantity',
        'current_quantity',
        'unit_of_measure',
        'has_quantity',
        'sequence_no',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date'      => 'date',
            'end_date'        => 'date',
            'weight_percentage' => 'decimal:2',
            'target_quantity' => 'integer',
            'current_quantity' => 'integer',
            'has_quantity'    => 'boolean',
        ];
    }

    // ── Relationships ───────────────────────────────────────────────────

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class, 'project_phase_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'milestone_id');
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(TaskProgressLog::class, 'milestone_id')->orderByDesc('created_at');
    }
}
