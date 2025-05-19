<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    public function view(User $user, File $file)
    {
        if ($file->task_id) {
            return $user->isAdmin() || 
                   $user->id === $file->task->project->user_id ||
                   $file->task->project->users()->where('users.id', $user->id)->exists();
        }

        if ($file->project_id) {
            return $user->isAdmin() || 
                   $user->id === $file->project->user_id ||
                   $file->project->users()->where('users.id', $user->id)->exists();
        }

        return false;
    }

    public function delete(User $user, File $file)
    {
        return $user->id === $file->user_id || 
               $user->isAdmin() || 
               ($file->project_id && $user->id === $file->project->user_id);
    }
} 