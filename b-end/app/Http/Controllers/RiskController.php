<?php

namespace App\Http\Controllers;

use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Project;
use App\Models\Notification;
use App\Models\User;

class RiskController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                Log::error('Unauthorized access attempt to risks index');
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $query = Risk::with(['project', 'project.manager']);

            // If project_id is provided, filter risks by project
            if ($request->has('project_id')) {
                $projectId = $request->project_id;
                $project = Project::find($projectId);
                
                if (!$project) {
                    Log::error('Attempt to fetch risks for non-existent project', [
                        'project_id' => $projectId,
                        'user_id' => $user->id
                    ]);
                    return response()->json(['error' => 'Project not found'], 404);
                }

                $query->where('project_id', $projectId);
            }

            // If user is not admin, only show risks from their projects
            if (!$user->isAdmin()) {
                $query->whereHas('project', function($q) use ($user) {
                    $q->where('manager_id', $user->id)
                      ->orWhere('user_id', $user->id);
                });
            }

            $risks = $query->latest()->get();

            Log::info('Successfully fetched risks', [
                'count' => $risks->count(),
                'user_id' => $user->id,
                'project_id' => $request->project_id ?? 'all'
            ]);

            return response()->json(['risks' => $risks]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch risks: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            return response()->json(['error' => 'Failed to fetch risks: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'severity' => ['required', Rule::in(['low', 'medium', 'high'])],
                'status' => ['required', Rule::in(['active', 'mitigated'])],
                'mitigation' => 'required|string',
                'project_id' => 'required|exists:projects,id'
            ]);

            $risk = Risk::create($validated);

            // Create notification for project manager and admin
            $project = Project::find($validated['project_id']);
            if ($project) {
                // Notify project manager
                if ($project->manager_id) {
                    Notification::create([
                        'type' => 'risk_created',
                        'message' => 'New risk added to project: ' . $project->name,
                        'user_id' => $project->manager_id,
                        'project_id' => $project->id
                    ]);
                }

                // Notify admins
                $admins = User::where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    Notification::create([
                        'type' => 'risk_created',
                        'message' => 'New risk added to project: ' . $project->name,
                        'user_id' => $admin->id,
                        'project_id' => $project->id
                    ]);
                }
            }

            return response()->json(['risk' => $risk], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create risk: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create risk'], 500);
        }
    }

    public function show(Risk $risk)
    {
        try {
            return response()->json(['risk' => $risk->load('project')]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch risk: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch risk'], 500);
        }
    }

    public function update(Request $request, Risk $risk)
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'severity' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
                'status' => ['sometimes', Rule::in(['active', 'mitigated'])],
                'mitigation' => 'sometimes|string'
            ]);

            $oldStatus = $risk->status;
            $risk->update($validated);

            // If risk was mitigated, create notification
            if ($oldStatus !== 'mitigated' && $risk->status === 'mitigated') {
                $project = $risk->project;
                if ($project) {
                    // Notify project manager
                    if ($project->manager_id) {
                        Notification::create([
                            'type' => 'risk_mitigated',
                            'message' => 'Risk mitigated in project: ' . $project->name,
                            'user_id' => $project->manager_id,
                            'project_id' => $project->id
                        ]);
                    }

                    // Notify admins
                    $admins = User::where('role', 'admin')->get();
                    foreach ($admins as $admin) {
                        Notification::create([
                            'type' => 'risk_mitigated',
                            'message' => 'Risk mitigated in project: ' . $project->name,
                            'user_id' => $admin->id,
                            'project_id' => $project->id
                        ]);
                    }
                }
            }

            return response()->json(['risk' => $risk]);
        } catch (\Exception $e) {
            Log::error('Failed to update risk: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update risk'], 500);
        }
    }

    public function destroy(Risk $risk)
    {
        try {
            $risk->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Failed to delete risk: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete risk'], 500);
        }
    }
} 