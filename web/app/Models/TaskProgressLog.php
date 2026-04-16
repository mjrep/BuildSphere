<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskProgressLog extends Model
{
    protected $fillable = [
        'task_id',
        'milestone_id',
        'created_by',
        'quantity_accomplished',
        'evidence_image_path',
        'remarks',
        'ai_verification_status',
        'work_date',
        'shift',
    ];

    protected function casts(): array
    {
        return [
            'quantity_accomplished' => 'integer',
            'work_date'             => 'date',
        ];
    }

    // ── Relationships ───────────────────────────────────────────────────

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ProjectMilestone::class, 'milestone_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
