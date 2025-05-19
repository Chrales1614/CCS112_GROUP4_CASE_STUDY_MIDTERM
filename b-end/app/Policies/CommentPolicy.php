<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommentPolicy
{
    use HandlesAuthorization;

    public function create(User $user)
    {
        // Allow any authenticated user to create comments
        return $user !== null;
    }

    public function update(User $user, Comment $comment)
    {
        return $user->id === $comment->user_id || 
               $user->isAdmin() || 
               $user->id === $comment->task->project->user_id;
    }

    public function delete(User $user, Comment $comment)
    {
        return $user->id === $comment->user_id || 
               $user->isAdmin() || 
               $user->id === $comment->task->project->user_id;
    }
}
