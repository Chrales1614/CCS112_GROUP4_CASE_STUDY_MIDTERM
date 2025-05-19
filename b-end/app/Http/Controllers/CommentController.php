<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function index(Task $task)
    {
        $comments = $task->comments()
            ->with(['user', 'replies.user'])
            ->whereNull('parent_id')
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, Task $task)
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to post comments'], 401);
            }

            $request->validate([
                'content' => 'required|string',
                'parent_id' => 'nullable|exists:comments,id'
            ]);

            $comment = $task->comments()->create([
                'content' => $request->content,
                'user_id' => Auth::id(), // Use Auth::id() instead of request user_id
                'parent_id' => $request->parent_id
            ]);

            // Load the user relationship before creating notification
            $comment->load('user');

            // Create notification for task owner and project members
            $this->createCommentNotification($task, $comment);

            return response()->json($comment->load('user'), 201);
        } catch (\Exception $e) {
            Log::error('Failed to post comment: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to post comment',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $request->validate([
            'content' => 'required|string'
        ]);

        $comment->update([
            'content' => $request->content
        ]);

        return response()->json($comment->load('user'));
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);
        
        $comment->delete();
        return response()->json(null, 204);
    }

    private function createCommentNotification(Task $task, Comment $comment)
    {
        try {
            // Get all admin users
            $adminUsers = \App\Models\User::where('role', 'admin')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notifications for admin users
            foreach ($adminUsers as $admin) {
                Notification::create([
                    'type' => 'comment',
                    'message' => $comment->user->name . ' commented on task: ' . $task->title,
                    'user_id' => $admin->id,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Get project managers
            $projectManagers = \App\Models\User::where('role', 'project_manager')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notifications for project managers
            foreach ($projectManagers as $manager) {
                Notification::create([
                    'type' => 'comment',
                    'message' => $comment->user->name . ' commented on task: ' . $task->title,
                    'user_id' => $manager->id,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Create notification for task owner
            if ($task->user_id !== Auth::id()) {
                Notification::create([
                    'type' => 'comment',
                    'message' => $comment->user->name . ' commented on task: ' . $task->title,
                    'user_id' => $task->user_id,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Notify assigned user if different from commenter and task owner
            if ($task->assigned_to && 
                $task->assigned_to !== Auth::id() && 
                $task->assigned_to !== $task->user_id) {
                Notification::create([
                    'type' => 'comment',
                    'message' => $comment->user->name . ' commented on task: ' . $task->title,
                    'user_id' => $task->assigned_to,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }

            // Notify project members
            $projectMembers = $task->project->users()
                ->where('users.id', '!=', Auth::id())
                ->where('users.id', '!=', $task->user_id)
                ->where('users.id', '!=', $task->assigned_to)
                ->get();

            foreach ($projectMembers as $member) {
                Notification::create([
                    'type' => 'comment',
                    'message' => $comment->user->name . ' commented on task: ' . $task->title,
                    'user_id' => $member->id,
                    'project_id' => $task->project_id,
                    'task_id' => $task->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to create comment notification: ' . $e->getMessage());
            // Don't throw the exception - we don't want to fail the comment creation if notification fails
        }
    }
} 