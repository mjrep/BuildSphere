<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProfileController;

// Public auth routes
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

// Protected routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/auth/user', fn() => response()->json(auth()->user()));

    Route::get('/profile/me', [ProfileController::class, 'show']);
    Route::put('/profile/update', [ProfileController::class, 'update']);
});

// Catch-all: serve React app (MUST be last)
Route::view('/{any?}', 'welcome')->where('any', '.*');