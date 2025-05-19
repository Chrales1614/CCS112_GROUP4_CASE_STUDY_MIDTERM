<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'message',
        'user_id',
        'project_id',
        'task_id',
        'read'
    ];

    protected $casts = [
        'read' => 'boolean'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function markAsRead(): void
    {
        $this->update(['read' => true]);
    }

    public function markAsUnread(): void
    {
        $this->update(['read' => false]);
    }
} 