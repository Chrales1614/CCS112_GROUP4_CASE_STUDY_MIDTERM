<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Comment;
use App\Models\File;
use App\Models\Notification;
use App\Policies\CommentPolicy;
use App\Policies\FilePolicy;
use App\Policies\NotificationPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Comment::class => CommentPolicy::class,
        File::class => FilePolicy::class,
        Notification::class => NotificationPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define gates for role-based access
        Gate::define('manage-projects', function ($user) {
            return $user->isAdmin() || $user->isProjectManager();
        });

        Gate::define('manage-tasks', function ($user) {
            return $user->isAdmin() || $user->isProjectManager() || $user->isTeamMember();
        });

        Gate::define('view-reports', function ($user, $project = null) {
            if (!$project) {
                return $user->isAdmin() || $user->isProjectManager() || $user->isTeamMember();
            }
            
            return $user->isAdmin() || 
                   ($user->isProjectManager() && $project->manager_id === $user->id) ||
                   ($user->isTeamMember() && $project->tasks()->where('assigned_to', $user->id)->exists());
        });

        Gate::define('manage-risks', function ($user, $project = null) {
            if (!$project) {
                return $user->isAdmin() || $user->isProjectManager() || $user->isTeamMember();
            }
            
            return $user->isAdmin() || 
                   ($user->isProjectManager() && $project->manager_id === $user->id) ||
                   ($user->isTeamMember() && $project->tasks()->where('assigned_to', $user->id)->exists());
        });
    }
}
