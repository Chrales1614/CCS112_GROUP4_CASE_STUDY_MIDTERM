<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                Log::error('Unauthorized access attempt to projects index');
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            Log::info('Fetching projects for user:', [
                'user_id' => $user->id,
                'role' => $user->role
            ]);

            $query = Project::with(['user', 'tasks', 'manager']);

            // If user is admin or project manager, show all projects
            if ($user->isAdmin() || $user->isProjectManager()) {
                $projects = $query->get();
                Log::info('Fetched all projects for admin/manager');
            } 
            // For team members, only show projects where they are assigned to tasks
            else if ($user->isTeamMember()) {
                $projects = Project::whereHas('tasks', function($query) use ($user) {
                    $query->where('assigned_to', $user->id);
                })->with(['user', 'tasks', 'manager'])->get();
                Log::info('Fetched projects for team member');
            }
            // For clients, show their own projects
            else {
                $projects = $query->where('user_id', $user->id)->get();
                Log::info('Fetched projects for client');
            }

            Log::info('Successfully fetched projects', [
                'count' => $projects->count()
            ]);

            return response()->json([
                'projects' => $projects,
                'user_role' => $user->role
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch projects: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            return response()->json([
                'error' => 'Failed to fetch projects',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'required|string|in:planning,in-progress,completed,on-hold',
                'budget' => 'nullable|array',
                'budget.*.item' => 'required_with:budget|string',
                'budget.*.amount' => 'required_with:budget|numeric|min:0',
                'actual_expenditure' => 'nullable|numeric',
            ]);

            // Validate that actual_expenditure does not exceed total budget if provided
            if (isset($validated['budget'], $validated['actual_expenditure'])) {
                $totalBudget = array_sum(array_column($validated['budget'], 'amount'));
                if ($validated['actual_expenditure'] > $totalBudget) {
                    return response()->json(['message' => 'Actual Expenditure cannot exceed the total Budget.'], 422);
                }
                if ($totalBudget < $validated['actual_expenditure']) {
                    return response()->json(['message' => 'Total Budget cannot be less than Actual Expenditure.'], 422);
                }
            }

            $project = Project::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'status' => $validated['status'],
                'budget' => $validated['budget'] ?? null,
                'actual_expenditure' => $validated['actual_expenditure'] ?? null,
                'user_id' => auth()->id(),
            ]);

            // Get all admin users
            $adminUsers = \App\Models\User::where('role', 'admin')
                ->where('id', '!=', auth()->id())
                ->get();

            // Create notifications for admin users
            foreach ($adminUsers as $admin) {
                Notification::create([
                    'type' => 'project_created',
                    'message' => auth()->user()->name . ' created a new project: ' . $project->name,
                    'user_id' => $admin->id,
                    'project_id' => $project->id,
                    'task_id' => null
                ]);
            }

            return response()->json(['project' => $project], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create project: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create project', 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Project $project)
    {
        try {
            Log::info('Fetching project details', [
                'project_id' => $project->id,
                'user_id' => Auth::id()
            ]);

            // Check if user has access to this project
            $user = Auth::user();
            if (!$user) {
                Log::error('Unauthorized access attempt to project details', [
                    'project_id' => $project->id
                ]);
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Check if user has permission to view this project
            if (!$user->isAdmin() && 
                $user->id !== $project->user_id && 
                $user->id !== $project->manager_id &&
                !$project->tasks()->where('assigned_to', $user->id)->exists()) {
                Log::error('Unauthorized project access attempt', [
                    'user_id' => $user->id,
                    'project_id' => $project->id,
                    'user_role' => $user->role
                ]);
                return response()->json(['error' => 'You do not have permission to view this project'], 403);
            }

            // Load relationships with error handling
            try {
                $project->load(['tasks', 'user', 'manager']);
            } catch (\Exception $e) {
                Log::error('Failed to load project relationships', [
                    'project_id' => $project->id,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }

            Log::info('Successfully fetched project details', [
                'project_id' => $project->id,
                'has_tasks' => $project->tasks->count() > 0,
                'has_user' => $project->user !== null,
                'has_manager' => $project->manager !== null
            ]);

            return response()->json([
                'project' => $project,
                'user_role' => $user->role
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch project details', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch project details',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|string|in:planning,in-progress,completed,on-hold',
            'budget' => 'nullable|array',
            'budget.*.item' => 'required_with:budget|string',
            'budget.*.amount' => 'required_with:budget|numeric|min:0',
            'actual_expenditure' => 'nullable|numeric',
            'progress' => 'nullable|integer|min:0|max:100',
        ]);

        // Validate that actual_expenditure does not exceed total budget
        if (isset($validated['budget'], $validated['actual_expenditure'])) {
            $totalBudget = array_sum(array_column($validated['budget'], 'amount'));
            if ($validated['actual_expenditure'] > $totalBudget) {
                return response()->json(['message' => 'Actual Expenditure cannot exceed the total Budget.'], 422);
            }
        }

        $project->update($validated);

        return response()->json(['project' => $project]);
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(['message' => 'Project deleted successfully']);
    }
}
