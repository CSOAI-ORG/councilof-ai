import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Plus, Trash2, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ReportSchedule {
  id: string;
  report_type: string;
  frequency: string;
  email_recipients: string[];
  active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
}

const REPORT_TYPES = [
  { value: 'jobs', label: 'Jobs Report' },
  { value: 'revenue', label: 'Revenue Report' },
  { value: 'compliance', label: 'Compliance Report' },
  { value: 'environmental', label: 'Environmental Report' },
  { value: 'fleet', label: 'Fleet Report' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ReportScheduler() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    report_type: '',
    frequency: 'weekly',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSchedule.report_type || !newSchedule.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const nextRun = new Date();
      if (newSchedule.frequency === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (newSchedule.frequency === 'weekly') {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }

      const { error } = await supabase
        .from('report_schedules')
        .insert({
          user_id: session.user.id,
          report_type: newSchedule.report_type,
          frequency: newSchedule.frequency,
          email_recipients: [newSchedule.email],
          next_run_at: nextRun.toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Schedule Created',
        description: 'Your report schedule has been set up',
      });
      
      setShowForm(false);
      setNewSchedule({ report_type: '', frequency: 'weekly', email: '' });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'Could not create schedule',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Schedule Deleted',
        description: 'The report schedule has been removed',
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Automate report generation and delivery
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Card className="border-dashed">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select 
                    value={newSchedule.report_type} 
                    onValueChange={(v) => setNewSchedule({ ...newSchedule, report_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={newSchedule.frequency} 
                    onValueChange={(v) => setNewSchedule({ ...newSchedule, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email Recipient</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newSchedule.email}
                    onChange={(e) => setNewSchedule({ ...newSchedule, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate}>Create Schedule</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scheduled reports yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {REPORT_TYPES.find(t => t.value === schedule.report_type)?.label}
                    </span>
                    <Badge variant={schedule.active ? 'default' : 'secondary'}>
                      {schedule.frequency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {schedule.email_recipients?.[0] || 'No email'}
                    </span>
                    {schedule.next_run_at && (
                      <span>Next: {format(new Date(schedule.next_run_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={schedule.active}
                    onCheckedChange={() => handleToggle(schedule.id, schedule.active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
