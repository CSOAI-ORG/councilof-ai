import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Settings, Trash2, CheckCheck, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <X className="h-5 w-5 text-red-500" />,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', Array.from(selectedIds));

      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n)
      );
      setSelectedIds(new Set());
      
      toast({
        title: 'Marked as Read',
        description: `${selectedIds.size} notification(s) marked as read`,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .in('id', Array.from(selectedIds));

      setNotifications(prev =>
        prev.filter(n => !selectedIds.has(n.id))
      );
      setSelectedIds(new Set());
      
      toast({
        title: 'Deleted',
        description: `${selectedIds.size} notification(s) deleted`,
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your account activity
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                      onCheckedChange={selectAll}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={filter === 'unread' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('unread')}
                      >
                        Unread
                      </Button>
                    </div>
                  </div>
                  
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={markSelectedAsRead}>
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                      <Button variant="outline" size="sm" onClick={deleteSelected}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">
                      {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when there\'s activity'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex items-start gap-4 py-4',
                          !notification.read && 'bg-muted/30 -mx-4 px-4'
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                        />
                        <div className="mt-0.5">
                          {TYPE_ICONS[notification.type] || TYPE_ICONS.info}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm',
                              !notification.read && 'font-medium'
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
