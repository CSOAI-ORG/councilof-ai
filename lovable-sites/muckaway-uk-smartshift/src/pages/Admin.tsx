import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Briefcase, FileText, Zap, Truck, UserCheck, Activity, RefreshCw, Shield, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PreLaunchChecklist } from '@/components/PreLaunchChecklist';
import { ComplianceRegister } from '@/components/ComplianceRegister';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VisualTestNotificationSettings } from '@/components/VisualTestNotificationSettings';

interface AdminStats {
  users: { total: number; recent_signups: number };
  jobs: { total: number; this_month: number };
  quotes: { total: number };
  ai: { interactions_this_month: number };
  fleet: { vehicles: number; drivers: number };
  activity: { events_today: number };
  generated_at: string;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  }

  async function fetchStats() {
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin statistics.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform overview and management
            </p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats.users.recent_signups} this week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Total Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.jobs.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.jobs.this_month} this month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Total Quotes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.quotes.total}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.ai.interactions_this_month}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Fleet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.fleet.vehicles}</div>
                      <p className="text-xs text-muted-foreground">Vehicles</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.fleet.drivers}</div>
                      <p className="text-xs text-muted-foreground">Drivers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.activity.events_today}</div>
                  <p className="text-xs text-muted-foreground">Analytics events</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Last Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-foreground">
                    {new Date(stats.generated_at).toLocaleTimeString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(stats.generated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Pre-Launch Checklist */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Pre-Launch Checklist</h2>
          <PreLaunchChecklist />
        </div>

        {/* Visual Test Notification Settings */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Test Notifications
          </h2>
          <VisualTestNotificationSettings />
        </div>

        {/* Compliance Register */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Compliance Register</h2>
          <ComplianceRegister />
        </div>
      </div>
    </DashboardLayout>
  );
}
