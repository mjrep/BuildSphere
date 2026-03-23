<?php

use App\Http\Controllers\ProjectMilestoneController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by bootstrap/app.php with the /api prefix.
| They use web + auth middleware for session-based SPA authentication.
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'auth'])->group(function () {
    // Phase title enum options for dropdown
    Route::get('/phase-titles', [ProjectMilestoneController::class, 'phaseTitles']);

    // Milestone plan CRUD
    Route::get('/projects/{project}/milestone-plan',  [ProjectMilestoneController::class, 'getMilestonePlan']);
    Route::post('/projects/{project}/milestone-plan', [ProjectMilestoneController::class, 'storeMilestonePlan']);

    // Chart (read-only, derived)
    Route::get('/projects/{project}/milestone-chart', [ProjectMilestoneController::class, 'getMilestoneChart']);

    // Final submit
    Route::post('/projects/{project}/milestone-submit', [ProjectMilestoneController::class, 'submitMilestoneReview']);
});
