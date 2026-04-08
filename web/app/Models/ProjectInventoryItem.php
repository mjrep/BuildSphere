<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectInventoryItem extends Model
{
    protected $table = 'project_inventory_items';

    protected $fillable = [
        'project_id',
        'item_name',
        'category',
        'current_stock',
        'critical_level',
        'price',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'current_stock' => 'float',
        'critical_level' => 'float',
        'price' => 'float',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
