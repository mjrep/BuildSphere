<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectInventoryItem;
use App\Http\Resources\ProjectInventoryItemResource;

class ProjectInventoryController extends Controller
{
    private function checkAccess(Request $request)
    {
        if (!in_array($request->user()->role, ['CEO', 'COO', 'Project Engineer', 'Project Coordinator', 'Foreman', 'Procurement'])) {
            abort(403, 'Unauthorized to manage project inventory.');
        }
    }

    public function index(Project $project)
    {
        $items = ProjectInventoryItem::where('project_id', $project->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return ProjectInventoryItemResource::collection($items);
    }

    public function store(Request $request, Project $project)
    {
        $this->checkAccess($request);

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'critical_level' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
        ]);

        $validated['project_id'] = $project->id;
        $validated['created_by'] = $request->user()->id;
        $validated['current_stock'] = 0;
        $validated['stock_unit'] = '';
        $validated['price_unit'] = '';

        $item = ProjectInventoryItem::create($validated);

        return new ProjectInventoryItemResource($item);
    }

    public function update(Request $request, Project $project, ProjectInventoryItem $item)
    {
        $this->checkAccess($request);

        if ($item->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'critical_level' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
        ]);

        $validated['updated_by'] = $request->user()->id;

        $item->update($validated);

        return new ProjectInventoryItemResource($item);
    }

    public function updateStock(Request $request, Project $project, ProjectInventoryItem $item)
    {
        $this->checkAccess($request);

        if ($item->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'current_stock' => 'required|numeric|min:0',
        ]);

        $item->update([
            'current_stock' => $validated['current_stock'],
            'updated_by' => $request->user()->id,
        ]);

        return new ProjectInventoryItemResource($item);
    }

    public function destroy(Request $request, Project $project, ProjectInventoryItem $item)
    {
        $this->checkAccess($request);

        if ($item->project_id !== $project->id) {
            abort(404);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}
