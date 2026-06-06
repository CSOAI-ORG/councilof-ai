import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, FileText, CreditCard, MessageSquare, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Job {
  id: string;
  material_type: string;
  volume_tonnes: number;
  site_address: string;
  status: string;
  scheduled_date: string | null;
  total_price: number | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; progress: number }> = {
  pending: { color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" />, progress: 20 },
  confirmed: { color: 'bg-blue-500', icon: <CheckCircle className="h-4 w-4" />, progress: 40 },
  in_progress: { color: 'bg-primary', icon: <Truck className="h-4 w-4" />, progress: 60 },
  completed: { color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" />, progress: 100 },
  cancelled: { color: 'bg-red-500', icon: <Clock className="h-4 w-4" />, progress: 0 },
};

export function CustomerSelfService() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
                <p className="text-xs text-muted-foreground">Active Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {jobs.reduce((sum, j) => sum + j.volume_tonnes, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Tonnes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Link to="/ai-tools">
              <Button className="w-full" size="sm">
                Request Quote
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : activeJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No active jobs</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Request a quote to get started
                </p>
                <Link to="/ai-tools">
                  <Button>Get AI Quote</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed jobs yet</p>
              </CardContent>
            </Card>
          ) : (
            completedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge className={config.color}>{job.status.replace('_', ' ')}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(job.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            
            <div>
              <p className="font-medium">{job.material_type}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.site_address}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span>{job.volume_tonnes} tonnes</span>
              {job.total_price && (
                <span className="font-medium">£{job.total_price.toFixed(2)}</span>
              )}
              {job.scheduled_date && (
                <span className="text-muted-foreground">
                  Scheduled: {format(new Date(job.scheduled_date), 'MMM d')}
                </span>
              )}
            </div>
          </div>

          <div className="w-full md:w-48">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{config.progress}%</span>
            </div>
            <Progress value={config.progress} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
