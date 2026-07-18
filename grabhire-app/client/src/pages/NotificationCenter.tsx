/**
 * Notification Center Component
 * Dropdown notification center with unread badge
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, Award, Briefcase } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export function NotificationCenter() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data, refetch } = trpc.notifications.getNotifications.useQuery(
    { limit: 10, unreadOnly: false },
    { enabled: open }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('All notifications marked as read');
      refetch();
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }

    // Navigate to link if provided
    if (notification.link) {
      setLocation(notification.link);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'compliance_alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'system_update':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'certificate_issued':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'job_application':
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {data && data.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {data.unreadCount > 9 ? '9+' : data.unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {data && data.unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="h-6 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!data || data.notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer rounded transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                        {notification.title}
                      </p>
                      {notification.priority !== 'medium' && (
                        <Badge className={`${getPriorityColor(notification.priority)} text-xs`}>
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate({ id: notification.id });
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate({ id: notification.id });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.total > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center text-blue-600 cursor-pointer"
              onClick={() => {
                setLocation('/settings');
                setOpen(false);
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
