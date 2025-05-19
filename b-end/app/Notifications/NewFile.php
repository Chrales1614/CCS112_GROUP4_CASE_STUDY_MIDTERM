<?php

namespace App\Notifications;

use App\Models\File;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewFile extends Notification implements ShouldQueue
{
    use Queueable;

    protected $file;

    public function __construct(File $file)
    {
        $this->file = $file;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $data = [
            'file_id' => $this->file->id,
            'user_id' => $this->file->user_id,
            'user_name' => $this->file->user->name,
            'file_name' => $this->file->name,
            'file_type' => $this->file->type
        ];

        if ($this->file->task_id) {
            $data['task_id'] = $this->file->task_id;
            $data['task_title'] = $this->file->task->title;
        }

        if ($this->file->project_id) {
            $data['project_id'] = $this->file->project_id;
            $data['project_name'] = $this->file->project->name;
        }

        return $data;
    }

    public function toBroadcast($notifiable)
    {
        $data = [
            'file_id' => $this->file->id,
            'user_id' => $this->file->user_id,
            'user_name' => $this->file->user->name,
            'file_name' => $this->file->name,
            'file_type' => $this->file->type
        ];

        if ($this->file->task_id) {
            $data['task_id'] = $this->file->task_id;
            $data['task_title'] = $this->file->task->title;
        }

        if ($this->file->project_id) {
            $data['project_id'] = $this->file->project_id;
            $data['project_name'] = $this->file->project->name;
        }

        return new BroadcastMessage($data);
    }
} 