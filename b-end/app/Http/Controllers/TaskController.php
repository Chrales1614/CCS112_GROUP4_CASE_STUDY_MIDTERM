<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $query = Task::query();
            
            // If project_id is provided, filter tasks by project
            if ($request->has('project_id')) {
                $project = Project::find($request->project_id);
                if (!$project) {
                    return response()->json(['error' => 'Project not found'], 404);
                }

                // Check access based on user role
                if ($user->isAdmin()) {
                    // Admin can see all tasks
                    $query->where('project_id', $request->project_id);
                } else if ($user->isProjectManager()) {
                    // Project manager can only see tasks from projects they created
                    if ($project->user_id === $user->id) {
                        $query->where('project_id', $request->project_id);
                    } else {
                        return response()->json(['error' => 'Unauthorized'], 403);
                    }
                } else if ($user->isTeamMember()) {
                    // Team member can see tasks assigned to them
                    $query->where('project_id', $request->project_id)
                          ->where('assigned_to', $user->id);
                } else if ($user->isClient()) {
                    // Client can see tasks from their projects
                    if ($project->user_id === $user->id) {
                        $query->where('project_id', $request->project_id);
                    } else {
                        return response()->json(['error' => 'Unauthorized'], 403);
                    }
                } else {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
            } else {
                // If no project_id provided, filter based on user role
                if ($user->isAdmin()) {
                    // Admin can see all tasks
                    $query->whereHas('project');
                } else if ($user->isProjectManager()) {
                    // Project manager can only see tasks from projects they created
                    $query->whereHas('project', function($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
                } else if ($user->isTeamMember()) {
                    // Team member can only see tasks assigned to them
                    $query->where('assigned_to', $user->id);
                } else if ($user->isClient()) {
                    // Client can only see tasks from their projects
                    $query->whereHas('project', function($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
                } else {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
            }
            
            if ($request->has('assigned_to_me') && $request->assigned_to_me) {
                $query->where('assigned_to', $user->id);
            }
            
            if ($request->has('limit')) {
                $query->limit($request->limit);
            }
            
            $tasks = $query->with(['project', 'assignedUser'])->get();

            $transformedTasks = $tasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'project_id' => $task->project_id,
                    'assigned_to' => $task->assigned_to,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'due_date' => $task->due_date,
                    'start_date' => $task->start_date,
                    'assignedUser' => $task->assignedUser ? [
                        'id' => $task->assignedUser->id,
                        'name' => $task->assignedUser->name,
                    ] : null,
                    'project' => $task->project ? [
                        'id' => $task->project->id,
                        'name' => $task->project->name,
                    ] : null,
                ];
            });

            return response()->json(['tasks' => $transformedTasks]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tasks: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch tasks', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'project_id' => 'required|exists:projects,id',
                'assigned_to' => 'nullable|exists:users,id',
                'status' => 'required|string|in:todo,in_progress,review,completed',
                'priority' => 'required|string|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'start_date' => 'nullable|date',
                'time_estimated' => 'nullable|numeric',
                'time_spent' => 'nullable|numeric',
            ]);

            $task = Task::create($validated);

            // Get all admin users
            $adminUsers = \App\Models\User::where('role', 'admin')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notifications for admin users
            foreach ($adminUsers as $admin) {
                Notification::create([
                    'type' => 'task_created',
                    'message' => Auth::user()->name . ' created a new task: ' . $task->title,
                    'user_id' => $admin->id,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Create notification for task assignment
            if ($task->assigned_to && $task->assigned_to !== Auth::id()) {
                Notification::create([
                    'type' => 'task_assigned',
                    'message' => Auth::user()->name . ' assigned you to task: ' . $task->title,
                    'user_id' => $task->assigned_to,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            return response()->json(['task' => $task], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create task: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create task', 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Task $task)
    {
        $task->load('project', 'assignedUser');
        $transformedTask = [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'project_id' => $task->project_id,
            'assigned_to' => $task->assigned_to,
            'status' => $task->status,
            'priority' => $task->priority,
            'due_date' => $task->due_date,
            'start_date' => $task->start_date,
            'created_at' => $task->created_at,
            'assignedUser' => $task->assignedUser ? [
                'id' => $task->assignedUser->id,
                'name' => $task->assignedUser->name,
            ] : null,
            'project' => $task->project ? [
                'id' => $task->project->id,
                'name' => $task->project->name,
            ] : null,
        ];
        return response()->json(['task' => $transformedTask]);
    }

    public function update(Request $request, Task $task)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'project_id' => 'required|exists:projects,id',
                'assigned_to' => 'nullable|exists:users,id',
                'status' => 'required|string|in:todo,in_progress,review,completed',
                'priority' => 'required|string|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'start_date' => 'nullable|date',
            ]);

            $oldStatus = $task->status;
            $oldAssignedTo = $task->assigned_to;

            $task->update($validated);

            // Get all admin users
            $adminUsers = \App\Models\User::where('role', 'admin')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notification for status change
            if ($oldStatus !== $task->status) {
                // Notify admin users about status change
                foreach ($adminUsers as $admin) {
                    Notification::create([
                        'type' => 'task_status',
                        'message' => Auth::user()->name . ' updated task status to ' . $task->status . ': ' . $task->title,
                        'user_id' => $admin->id,
                        'project_id' => $task->project_id,
                        'task_id' => $task->id
                    ]);
                }

                // Notify project members about status change
                $projectMembers = $task->project->users()
                    ->where('users.id', '!=', Auth::id())
                    ->get();

                foreach ($projectMembers as $member) {
                    Notification::create([
                        'type' => 'task_status',
                        'message' => Auth::user()->name . ' updated task status to ' . $task->status . ': ' . $task->title,
                        'user_id' => $member->id,
                        'project_id' => $task->project_id,
                        'task_id' => $task->id
                    ]);
                }
            }

            // Create notification for assignment change
            if ($oldAssignedTo !== $task->assigned_to && $task->assigned_to && $task->assigned_to !== Auth::id()) {
                // Notify admin users about assignment change
                foreach ($adminUsers as $admin) {
                    Notification::create([
                        'type' => 'task_assigned',
                        'message' => Auth::user()->name . ' assigned task to ' . $task->assignedUser->name . ': ' . $task->title,
                        'user_id' => $admin->id,
                        'project_id' => $task->project_id,
                        'task_id' => $task->id
                    ]);
                }

                // Notify the assigned user
                Notification::create([
                    'type' => 'task_assigned',
                    'message' => Auth::user()->name . ' assigned you to task: ' . $task->title,
                    'user_id' => $task->assigned_to,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Add this to the update method where we change task status
            if ($request->status === 'completed' && $task->status !== 'completed') {
                $task->completed_at = now();
            } elseif ($request->status !== 'completed') {
                $task->completed_at = null;
            }

            // Load relationships before returning
            $task->load(['project', 'assignedUser']);
            
            // Transform task data to match frontend expectations
            $transformedTask = [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'project_id' => $task->project_id,
                'assigned_to' => $task->assigned_to,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date,
                'start_date' => $task->start_date,
                'created_at' => $task->created_at,
                'assignedUser' => $task->assignedUser ? [
                    'id' => $task->assignedUser->id,
                    'name' => $task->assignedUser->name,
                ] : null,
                'project' => $task->project ? [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                ] : null,
            ];
            
            return response()->json(['task' => $transformedTask]);
        } catch (\Exception $e) {
            Log::error('Failed to update task: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update task', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Task $task)
    {
        try {
            $task->delete();

            // Notify project members about task deletion
            $projectMembers = $task->project->users()
                ->where('users.id', '!=', Auth::id())
                ->get();

            foreach ($projectMembers as $member) {
                Notification::create([
                    'type' => 'task_deleted',
                    'message' => Auth::user()->name . ' deleted task: ' . $task->title,
                    'user_id' => $member->id,
                    'project_id' => $task->project_id,
                    'task_id' => null
                ]);
            }

            return response()->json(['message' => 'Task deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete task: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete task', 'message' => $e->getMessage()], 500);
        }
    }

    public function getProjectTasks($projectId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $project = Project::findOrFail($projectId);

            // Check access based on user role
            if ($user->isAdmin()) {
                // Admin can see all tasks
                $tasks = Task::where('project_id', $projectId)
                            ->with(['assignedUser'])
                            ->get();
            } else if ($user->isProjectManager()) {
                // Project manager can only see tasks from projects they created
                if ($project->user_id === $user->id) {
                    $tasks = Task::where('project_id', $projectId)
                                ->with(['assignedUser'])
                                ->get();
                } else {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
            } else if ($user->isTeamMember()) {
                // Team member can only see tasks assigned to them
                $tasks = Task::where('project_id', $projectId)
                            ->where('assigned_to', $user->id)
                            ->with(['assignedUser'])
                            ->get();
            } else if ($user->isClient()) {
                // Client can only see tasks from their projects
                if ($project->user_id === $user->id) {
                    $tasks = Task::where('project_id', $projectId)
                                ->with(['assignedUser'])
                                ->get();
                } else {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
            } else {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Transform tasks to ensure assignedUser is included properly
            $transformedTasks = $tasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'project_id' => $task->project_id,
                    'assigned_to' => $task->assigned_to,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'due_date' => $task->due_date,
                    'start_date' => $task->start_date,
                    'assignedUser' => $task->assignedUser ? [
                        'id' => $task->assignedUser->id,
                        'name' => $task->assignedUser->name,
                    ] : null,
                ];
            });

            return response()->json(['tasks' => $transformedTasks]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch project tasks: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch project tasks', 'message' => $e->getMessage()], 500);
        }
    }
}
