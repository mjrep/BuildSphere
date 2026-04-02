<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMilestoneController;
use App\Http\Controllers\ProjectApprovalController;
use App\Http\Controllers\ProjectInventoryController;
use App\Http\Controllers\ClientController;

// API Routes (Prefixed with /api)
Route::prefix('api')->group(function () {
    // Public routes (Auth)
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);

    // Protected API routes
    Route::middleware('auth')->group(function () {
        Route::post('/logout', [LoginController::class, 'logout']);
        Route::get('/auth/user', fn() => response()->json(auth()->user()));

        Route::get('/profile/me', [ProfileController::class, 'show']);
        Route::put('/profile/update', [ProfileController::class, 'update']);

        // Projects
        Route::get('/project-statuses', [ProjectController::class, 'statuses']);
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::get('/projects/{project}', [ProjectController::class, 'show']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
        Route::post('/projects/{project}/team', [ProjectController::class, 'addTeamMember']);

        // Milestones
        Route::get('/projects/{project}/milestones', [ProjectMilestoneController::class, 'index']);
        Route::post('/projects/{project}/milestones', [ProjectMilestoneController::class, 'store']);

        // Inventory
        Route::get('/projects/{project}/inventory', [ProjectInventoryController::class, 'index']);
        Route::post('/projects/{project}/inventory', [ProjectInventoryController::class, 'store']);
        Route::put('/projects/{project}/inventory/{item}', [ProjectInventoryController::class, 'update']);
        Route::patch('/projects/{project}/inventory/{item}/stock', [ProjectInventoryController::class, 'updateStock']);
        Route::delete('/projects/{project}/inventory/{item}', [ProjectInventoryController::class, 'destroy']);

        // Approvals
        Route::post('/projects/{project}/accounting-approval', [ProjectApprovalController::class, 'accountingApproval']);
        Route::post('/projects/{project}/executive-approval', [ProjectApprovalController::class, 'executiveApproval']);

        // Clients
        Route::get('/clients', [ClientController::class, 'index']);
        Route::post('/clients', [ClientController::class, 'store']);

        // Users
        Route::get('/users', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\User::query();
            if ($request->filled('role')) {
                $query->where('role', $request->role);
            }
            return $query->select('id', 'first_name', 'last_name', 'role')
                ->orderBy('first_name')
                ->get()
                ->map(fn ($u) => [
                    'id'   => $u->id,
                    'name' => $u->first_name . ' ' . $u->last_name,
                    'role' => $u->role,
                ]);
        });
    });
});

// Catch-all: serve React app (MUST be last)
Route::view('/{any?}', 'welcome')->where('any', '.*');