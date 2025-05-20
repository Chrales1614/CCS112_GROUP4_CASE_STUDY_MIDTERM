<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RiskController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/





Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum'])->group(function () {
    // User profile route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Project routes
    Route::apiResource('projects', \App\Http\Controllers\ProjectController::class);

    // Task routes
    Route::apiResource('tasks', \App\Http\Controllers\TaskController::class);

    // Get tasks for a specific project
    Route::get('projects/{project}/tasks', [\App\Http\Controllers\TaskController::class, 'getProjectTasks']);

    // Get all users for task assignment
    Route::get('/users', function () {
        return response()->json(['users' => \App\Models\User::all()]);
    });

    // Comment routes
    Route::get('/tasks/{task}/comments', [CommentController::class, 'index']);
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // File routes
    Route::get('/files', [FileController::class, 'index']);
    Route::post('/files', [FileController::class, 'store']);
    Route::get('/files/{file}', [FileController::class, 'show']);
    Route::get('/files/{file}/download', [FileController::class, 'download']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Reports Routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/reports/projects', [ReportController::class, 'getProjects']);
        Route::get('/reports/project/{project}/data', [ReportController::class, 'getProjectData']);
        Route::get('/reports/project/{project}/risk-metrics', [ReportController::class, 'getRiskMetrics']);
        Route::get('/reports/project/{project}/task-trends', [ReportController::class, 'getTaskTrends']);
    });

    // Risk Management Routes
    Route::apiResource('risks', RiskController::class);
});
