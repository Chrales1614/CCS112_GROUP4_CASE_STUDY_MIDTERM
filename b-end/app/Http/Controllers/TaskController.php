<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::query();
        
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }
        
        if ($request->has('assigned_to_me') && $request->assigned_to_me) {
            $query->where('assigned_to', auth()->id());
        }
        
        if ($request->has('limit')) {
            $query->limit($request->limit);
        }
        
        $tasks = $query->with(['project', 'assignedUser'])->get();
        return response()->json(['tasks' => $tasks]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'required|string|in:todo,in_progress,review,completed',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create($validated);

        return response()->json(['task' => $task], 201);
    }

    public function show(Task $task)
    {
        return response()->json(['task' => $task->load('project', 'assignedUser')]);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'required|string|in:todo,in_progress,review,completed',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
        ]);

        $task->update($validated);

        return response()->json(['task' => $task]);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function getProjectTasks($projectId)
    {
        $project = Project::findOrFail($projectId);
        $tasks = Task::where('project_id', $projectId)
                    ->with(['assignedUser'])
                    ->get();
                    
        return response()->json(['tasks' => $tasks]);
    }
}
