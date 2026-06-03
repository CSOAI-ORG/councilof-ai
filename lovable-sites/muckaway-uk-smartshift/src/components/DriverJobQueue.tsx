import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, MapPin, Camera, Check, Clock, Navigation, 
  Phone, ChevronRight, Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DriverJobCard } from "@/components/DriverJobCard";

interface DriverJobQueueProps {
  filter: 'today' | 'upcoming' | 'completed';
  isOnline: boolean;
  currentLocation: GeolocationCoordinates | null;
  onQueueOfflineAction: (action: { type: string; jobId: string; data: any }) => void;
}

interface Job {
  id: string;
  site_address: string;
  site_postcode: string;
  material_type: string;
  volume_tonnes: number;
  status: string;
  scheduled_date: string;
  customer?: {
    company_name: string;
    contact_name: string;
    phone: string;
  };
}

export const DriverJobQueue = ({ 
  filter, 
  isOnline, 
  currentLocation,
  onQueueOfflineAction 
}: DriverJobQueueProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('jobs')
        .select(`
          id,
          site_address,
          site_postcode,
          material_type,
          volume_tonnes,
          status,
          scheduled_date,
          customers (
            company_name,
            contact_name,
            phone
          )
        `)
        .order('scheduled_date', { ascending: true });

      // Apply filter
      switch (filter) {
        case 'today':
          query = query
            .eq('scheduled_date', today)
            .in('status', ['pending', 'in_progress', 'en_route']);
          break;
        case 'upcoming':
          query = query
            .gt('scheduled_date', today)
            .neq('status', 'completed');
          break;
        case 'completed':
          query = query.eq('status', 'completed').limit(20);
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to flatten customer
      const transformedJobs = (data || []).map(job => ({
        ...job,
        customer: job.customers || undefined,
      }));

      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Try to load from cache if offline
      if (!isOnline) {
        const cached = localStorage.getItem('driver_jobs_cache');
        if (cached) {
          setJobs(JSON.parse(cached));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    if (isOnline) {
      try {
        const { error } = await supabase
          .from('jobs')
          .update({ status: newStatus })
          .eq('id', jobId);

        if (error) throw error;

        toast({
          title: "Status Updated",
          description: `Job marked as ${newStatus}`,
        });

        loadJobs();
      } catch (error) {
        console.error('Error updating status:', error);
        toast({
          title: "Update Failed",
          description: "Queuing for offline sync",
          variant: "destructive",
        });
        onQueueOfflineAction({
          type: 'status_update',
          jobId,
          data: { status: newStatus },
        });
      }
    } else {
      onQueueOfflineAction({
        type: 'status_update',
        jobId,
        data: { status: newStatus },
      });
    }
  };

  const handleGPSCheckin = (jobId: string) => {
    if (currentLocation) {
      const checkinData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        timestamp: new Date().toISOString(),
      };

      if (isOnline) {
        // In production, this would call an edge function
        console.log('GPS check-in:', checkinData);
        toast({
          title: "Checked In",
          description: "Location recorded successfully",
        });
      } else {
        onQueueOfflineAction({
          type: 'gps_checkin',
          jobId,
          data: checkinData,
        });
      }
    } else {
      toast({
        title: "GPS Unavailable",
        description: "Enable location services",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === 'today' && "No jobs scheduled for today"}
            {filter === 'upcoming' && "No upcoming jobs"}
            {filter === 'completed' && "No completed jobs yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <DriverJobCard
          key={job.id}
          job={job}
          isOnline={isOnline}
          currentLocation={currentLocation}
          onStatusUpdate={handleStatusUpdate}
          onGPSCheckin={handleGPSCheckin}
        />
      ))}
    </div>
  );
};

export default DriverJobQueue;
