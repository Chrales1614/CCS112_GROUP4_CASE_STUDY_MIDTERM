<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'manager_id',
        'user_id',
        'budget',
        'actual_expenditure'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'array',
        'actual_expenditure' => 'decimal:2',
    ];

    protected $with = ['user', 'manager'];

    protected $appends = ['total_budget'];

    public function getTotalBudgetAttribute()
    {
        try {
            if (!is_array($this->budget)) {
                return 0;
            }
            
            return collect($this->budget)->sum(function ($item) {
                if (!isset($item['amount'])) {
                    return 0;
                }
                
                $amount = is_numeric($item['amount']) ? (float)$item['amount'] : 0;
                return round($amount, 2);
            });
        } catch (\Exception $e) {
            \Log::error('Error calculating total budget: ' . $e->getMessage(), [
                'project_id' => $this->id,
                'budget' => $this->budget
            ]);
            return 0;
        }
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id')->withDefault([
            'name' => 'Unassigned',
            'email' => '',
            'role' => 'none'
        ]);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault([
            'name' => 'Unknown',
            'email' => '',
            'role' => 'none'
        ]);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function files()
    {
        return $this->hasMany(File::class);
    }

    public function risks()
    {
        return $this->hasMany(Risk::class);
    }
}
