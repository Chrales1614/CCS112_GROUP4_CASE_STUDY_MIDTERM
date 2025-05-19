<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Risk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function getProjectData()
    {
        // Calculate project progress
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'completed')->count();
        $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

        // Get task statistics
        $taskStats = [
            'total' => $totalTasks,
            'completed' => $completedTasks,
            'inProgress' => Task::where('status', 'in-progress')->count(),
            'pending' => Task::where('status', 'pending')->count()
        ];

        // Get budget information (mock data - replace with actual budget tracking)
        $budget = [
            'allocated' => 100000,
            'spent' => 65000,
            'remaining' => 35000
        ];

        return response()->json([
            'progress' => $progress,
            'tasks' => $taskStats,
            'budget' => $budget
        ]);
    }

    public function getRiskMetrics()
    {
        $riskMetrics = [
            'total' => Risk::count(),
            'by_severity' => [
                'critical' => Risk::where('severity', 'critical')->count(),
                'high' => Risk::where('severity', 'high')->count(),
                'medium' => Risk::where('severity', 'medium')->count(),
                'low' => Risk::where('severity', 'low')->count(),
            ],
            'by_status' => [
                'open' => Risk::where('status', 'open')->count(),
                'in_progress' => Risk::where('status', 'in-progress')->count(),
                'resolved' => Risk::where('status', 'resolved')->count(),
            ]
        ];

        return response()->json($riskMetrics);
    }

    public function getTaskTrends()
    {
        $trends = DB::table('tasks')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($trends);
    }
} 