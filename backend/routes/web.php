<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'RS Digital Portal API',
        'version' => '1.0.0',
        'docs' => 'See /api/* routes for API endpoints',
    ]);
});

// Named login route — required by Laravel's auth middleware redirect
// This is an API-only backend; redirect to frontend login instead
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated. Please login via the frontend.'], 401);
})->name('login');
