<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewComment extends Notification implements ShouldQueue
{
    use Queueable;

    protected $comment;

    public function __construct(Comment $comment)
    {
        $this->comment = $comment;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        return [
            'comment_id' => $this->comment->id,
            'task_id' => $this->comment->task_id,
            'user_id' => $this->comment->user_id,
            'user_name' => $this->comment->user->name,
            'content' => $this->comment->content,
            'task_title' => $this->comment->task->title
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'comment_id' => $this->comment->id,
            'task_id' => $this->comment->task_id,
            'user_id' => $this->comment->user_id,
            'user_name' => $this->comment->user->name,
            'content' => $this->comment->content,
            'task_title' => $this->comment->task->title
        ]);
    }
} 