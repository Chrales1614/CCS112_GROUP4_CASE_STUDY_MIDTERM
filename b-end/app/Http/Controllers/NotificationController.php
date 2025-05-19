<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::with(['user', 'project', 'task'])
            ->where('user_id', Auth::id());

        if ($request->has('unread_only') && $request->unread_only) {
            $query->where('read', false);
        }

        $notifications = $query->latest()->get();
        return response()->json($notifications);
    }

    public function markAsRead(Notification $notification)
    {
        $this->authorize('update', $notification);
        $notification->markAsRead();
        return response()->json($notification);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Notification $notification)
    {
        $this->authorize('delete', $notification);
        $notification->delete();
        return response()->json(null, 204);
    }

    public function getUnreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }
} 