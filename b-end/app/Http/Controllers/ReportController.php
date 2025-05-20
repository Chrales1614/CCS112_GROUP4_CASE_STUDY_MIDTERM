<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    public function getProjects()
    {
        try {
            $user = Auth::user();
            
            // If admin, return all projects
            if ($user->role === 'admin') {
                $projects = Project::all();
            } 
            // If manager, return only projects they created
            else if ($user->role === 'manager') {
                $projects = Project::where('manager_id', $user->id)->get();
            }
            // If neither, return empty array
            else {
                $projects = [];
            }

            return response()->json(['projects' => $projects]);
        } catch (\Exception $e) {
            Log::error('Error in getProjects: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch projects'], 500);
        }
    }

    public function getProjectData($projectId)
    {
        try {
            $user = Auth::user();
            $project = Project::findOrFail($projectId);

            // Check if user has access to this project
            if ($user->role !== 'admin' && ($user->role !== 'manager' || $project->manager_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get project tasks
            $tasks = Task::where('project_id', $projectId)->get();
            
            // Calculate task statistics using the same status categories as project details
            $totalTasks = $tasks->count();
            $completedTasks = $tasks->where('status', 'completed')->count();
            $inProgressTasks = $tasks->where('status', 'in_progress')->count();
            $reviewTasks = $tasks->where('status', 'review')->count();
            $todoTasks = $tasks->where('status', 'todo')->count();

            // Calculate progress using weighted completion
            $progress = $totalTasks > 0 ? 
                (($completedTasks * 1.0) + ($reviewTasks * 0.75) + ($inProgressTasks * 0.5) + ($todoTasks * 0)) / $totalTasks * 100 
                : 0;

            // Calculate budget information
            $budget = [];
            if (is_array($project->budget)) {
                $allocated = collect($project->budget)->sum(function ($item) {
                    return isset($item['amount']) ? (float)$item['amount'] : 0;
                });
                $spent = (float)($project->actual_expenditure ?? 0);
                $budget = [
                    'allocated' => round($allocated, 2),
                    'spent' => round($spent, 2),
                    'remaining' => round($allocated - $spent, 2)
                ];
            } else {
                $budget = [
                    'allocated' => 0,
                    'spent' => 0,
                    'remaining' => 0
                ];
            }

            Log::info('Project data calculated:', [
                'project_id' => $projectId,
                'budget' => $budget,
                'tasks' => [
                    'total' => $totalTasks,
                    'completed' => $completedTasks,
                    'inProgress' => $inProgressTasks,
                    'review' => $reviewTasks,
                    'todo' => $todoTasks
                ]
            ]);

            return response()->json([
                'progress' => round($progress, 2),
                'budget' => $budget,
                'tasks' => [
                    'total' => $totalTasks,
                    'completed' => $completedTasks,
                    'inProgress' => $inProgressTasks,
                    'review' => $reviewTasks,
                    'todo' => $todoTasks
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getProjectData: ' . $e->getMessage(), [
                'project_id' => $projectId,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch project data: ' . $e->getMessage()], 500);
        }
    }

    public function getRiskMetrics($projectId)
    {
        try {
            $user = Auth::user();
            $project = Project::findOrFail($projectId);

            // Check if user has access to this project
            if ($user->role !== 'admin' && ($user->role !== 'manager' || $project->manager_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $risks = Risk::where('project_id', $projectId)->get();
            
            $riskMetrics = [
                'total' => $risks->count(),
                'high' => $risks->where('severity', 'high')->count(),
                'medium' => $risks->where('severity', 'medium')->count(),
                'low' => $risks->where('severity', 'low')->count(),
                'mitigated' => $risks->where('status', 'mitigated')->count(),
                'active' => $risks->where('status', 'active')->count()
            ];

            return response()->json($riskMetrics);
        } catch (\Exception $e) {
            Log::error('Error in getRiskMetrics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch risk metrics'], 500);
        }
    }

    public function getTaskTrends($projectId)
    {
        try {
            $user = Auth::user();
            $project = Project::findOrFail($projectId);

            // Check if user has access to this project
            if ($user->role !== 'admin' && ($user->role !== 'manager' || $project->manager_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get tasks grouped by completion date
            // Check if completed_at column exists, if not use updated_at
            if (Schema::hasColumn('tasks', 'completed_at')) {
                $taskTrends = Task::where('project_id', $projectId)
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->selectRaw('DATE(completed_at) as date, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
            } else {
                // Fallback to using updated_at for completed tasks
                $taskTrends = Task::where('project_id', $projectId)
                    ->where('status', 'completed')
                    ->selectRaw('DATE(updated_at) as date, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
            }

            return response()->json($taskTrends);
        } catch (\Exception $e) {
            Log::error('Error in getTaskTrends: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch task trends'], 500);
        }
    }
} 