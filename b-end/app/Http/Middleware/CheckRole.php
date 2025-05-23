<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = Auth::user();
        
        if (!in_array($user->role, $roles)) {
            return response()->json(['error' => 'Unauthorized. Insufficient permissions.'], 403);
        }

        return $next($request);
    }
} 