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
            $query = Project::with('user');

            // If user is admin or project manager, show all projects
            if ($user->isAdmin() || $user->isProjectManager()) {
                $projects = $query->get();
            } 
            // For team members, only show projects where they are assigned to tasks
            else if ($user->isTeamMember()) {
                $projects = Project::whereHas('tasks', function($query) use ($user) {
                    $query->where('assigned_to', $user->id);
                })->with('user')->get();
            }
            // For clients, show their own projects
            else {
                $projects = $query->where('user_id', $user->id)->get();
            }

            return response()->json(['projects' => $projects]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch projects: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch projects', 'message' => $e->getMessage()], 500);
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
                'status' => 'required|string|in:planning,active,completed,on_hold',
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
        return response()->json(['project' => $project->load('tasks', 'user')]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|string|in:planning,active,completed,on_hold',
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
