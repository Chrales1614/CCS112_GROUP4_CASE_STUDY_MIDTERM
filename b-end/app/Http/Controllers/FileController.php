<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Task;
use App\Models\Project;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function index(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to view files'], 401);
            }

            $query = File::with(['user', 'task', 'project']);

            if ($request->has('task_id')) {
                $query->where('task_id', $request->task_id);
            }

            if ($request->has('project_id')) {
                $query->where('project_id', $request->project_id);
            }

            $files = $query->latest()->get();
            return response()->json($files);
        } catch (\Exception $e) {
            Log::error('Failed to fetch files: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch files', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to upload files'], 401);
            }

            $request->validate([
                'file' => 'required|file|max:10240', // 10MB max
                'task_id' => 'nullable|exists:tasks,id',
                'project_id' => 'nullable|exists:projects,id'
            ]);

            if (!$request->hasFile('file')) {
                return response()->json(['error' => 'No file uploaded', 'message' => 'Please select a file to upload'], 400);
            }

            $uploadedFile = $request->file('file');
            $path = $uploadedFile->store('files/' . date('Y/m'), 'public');

            $file = File::create([
                'name' => $uploadedFile->getClientOriginalName(),
                'path' => $path,
                'type' => $uploadedFile->getMimeType(),
                'size' => $uploadedFile->getSize(),
                'task_id' => $request->task_id,
                'project_id' => $request->project_id,
                'user_id' => Auth::id()
            ]);

            // Create notification for file upload
            $this->createFileNotification($file);

            return response()->json($file->load('user'), 201);
        } catch (\Exception $e) {
            Log::error('Failed to upload file: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to upload file', 'message' => $e->getMessage()], 500);
        }
    }

    public function show(File $file)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to view file details'], 401);
            }

            return response()->json($file->load(['user', 'task', 'project']));
        } catch (\Exception $e) {
            Log::error('Failed to fetch file details: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch file details', 'message' => $e->getMessage()], 500);
        }
    }

    public function download(File $file)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to download files'], 401);
            }

            if (!Storage::disk('public')->exists($file->path)) {
                return response()->json(['error' => 'File not found', 'message' => 'The requested file does not exist'], 404);
            }

            return Storage::disk('public')->download(
                $file->path,
                $file->name
            );
        } catch (\Exception $e) {
            Log::error('Failed to download file: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to download file', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(File $file)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['error' => 'Unauthorized', 'message' => 'User must be authenticated to delete files'], 401);
            }

            $this->authorize('delete', $file);

            if (!Storage::disk('public')->exists($file->path)) {
                // If file doesn't exist in storage but exists in DB, just delete the DB record
                $file->delete();
                return response()->json(null, 204);
            }

            Storage::disk('public')->delete($file->path);
            $file->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Failed to delete file: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete file', 'message' => $e->getMessage()], 500);
        }
    }

    private function createFileNotification(File $file)
    {
        try {
            $message = Auth::user()->name . ' uploaded a file: ' . $file->name;

            // Get all admin users
            $adminUsers = \App\Models\User::where('role', 'admin')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notifications for admin users
            foreach ($adminUsers as $admin) {
                Notification::create([
                    'type' => 'file',
                    'message' => $message,
                    'user_id' => $admin->id,
                    'project_id' => $file->project_id,
                    'task_id' => $file->task_id
                ]);
            }

            // Get project managers
            $projectManagers = \App\Models\User::where('role', 'project_manager')
                ->where('id', '!=', Auth::id())
                ->get();

            // Create notifications for project managers
            foreach ($projectManagers as $manager) {
                Notification::create([
                    'type' => 'file',
                    'message' => $message,
                    'user_id' => $manager->id,
                    'project_id' => $file->project_id,
                    'task_id' => $file->task_id
                ]);
            }

            if ($file->task_id) {
                $task = Task::find($file->task_id);
                if ($task) {
                    // Notify task owner if different from uploader
                    if ($task->user_id !== Auth::id()) {
                        Notification::create([
                            'type' => 'file',
                            'message' => $message,
                            'user_id' => $task->user_id,
                            'project_id' => $task->project_id,
                            'task_id' => $task->id
                        ]);
                    }

                    // Notify assigned user if different from uploader and task owner
                    if ($task->assigned_to && 
                        $task->assigned_to !== Auth::id() && 
                        $task->assigned_to !== $task->user_id) {
                        Notification::create([
                            'type' => 'file',
                            'message' => $message,
                            'user_id' => $task->assigned_to,
                            'project_id' => $task->project_id,
                            'task_id' => $task->id
                        ]);
                    }

                    // Notify project members
                    if ($task->project) {
                        $projectMembers = $task->project->users()
                            ->where('users.id', '!=', Auth::id())
                            ->where('users.id', '!=', $task->user_id)
                            ->where('users.id', '!=', $task->assigned_to)
                            ->get();

                        foreach ($projectMembers as $member) {
                            Notification::create([
                                'type' => 'file',
                                'message' => $message,
                                'user_id' => $member->id,
                                'project_id' => $task->project_id,
                                'task_id' => $task->id
                            ]);
                        }
                    }
                }
            } elseif ($file->project_id) {
                $project = Project::find($file->project_id);
                if ($project) {
                    $projectMembers = $project->users()
                        ->where('users.id', '!=', Auth::id())
                        ->get();

                    foreach ($projectMembers as $member) {
                        Notification::create([
                            'type' => 'file',
                            'message' => $message,
                            'user_id' => $member->id,
                            'project_id' => $project->id,
                            'task_id' => null
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to create file notification: ' . $e->getMessage());
            // Don't throw the exception - we don't want to fail the file upload if notification fails
        }
    }
} 