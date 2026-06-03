import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Route, MapPin, Clock, Navigation, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Stop {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  job_id?: string;
}

interface OptimizedStop {
  order: number;
  id: string;
  job_id?: string;
  address: string;
  latitude: number;
  longitude: number;
  eta: string;
  distance_from_previous: number;
  duration_from_previous: number;
}

interface RouteResult {
  distance_km: number;
  duration_mins: number;
  stops: OptimizedStop[];
  geometry: any;
}

interface Job {
  id: string;
  site_address: string;
  site_postcode: string;
  material_type: string;
  volume_tonnes: number;
  scheduled_date: string;
}

interface RouteOptimizerProps {
  selectedDate?: Date;
  driverId?: string;
  vehicleId?: string;
  onRouteOptimized?: (route: RouteResult) => void;
}

// UK postcode to approximate coordinates mapping
const postcodeToCoords: Record<string, { lat: number; lng: number }> = {
  'SW1': { lat: 51.4975, lng: -0.1357 },
  'EC1': { lat: 51.5225, lng: -0.1031 },
  'W1': { lat: 51.5134, lng: -0.1488 },
  'SE1': { lat: 51.5045, lng: -0.0865 },
  'E1': { lat: 51.5145, lng: -0.0598 },
  'N1': { lat: 51.5385, lng: -0.0939 },
  'NW1': { lat: 51.5244, lng: -0.1427 },
  'WC1': { lat: 51.5207, lng: -0.1207 },
  'SW': { lat: 51.4613, lng: -0.1692 },
  'SE': { lat: 51.4733, lng: -0.0478 },
  'NW': { lat: 51.5515, lng: -0.2054 },
  'DEFAULT': { lat: 51.5074, lng: -0.1278 }, // Central London
};

const getApproxCoords = (postcode: string | null): { lat: number; lng: number } => {
  if (!postcode) return postcodeToCoords['DEFAULT'];
  
  const prefix = postcode.toUpperCase().split(' ')[0];
  for (const key of Object.keys(postcodeToCoords)) {
    if (prefix.startsWith(key)) {
      // Add small random offset for visual variety
      return {
        lat: postcodeToCoords[key].lat + (Math.random() - 0.5) * 0.05,
        lng: postcodeToCoords[key].lng + (Math.random() - 0.5) * 0.05,
      };
    }
  }
  return postcodeToCoords['DEFAULT'];
};

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  selectedDate = new Date(),
  driverId,
  vehicleId,
  onRouteOptimized,
}) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteResult | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, selectedDate]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('jobs')
        .select('id, site_address, site_postcode, material_type, volume_tonnes, scheduled_date')
        .eq('user_id', user?.id)
        .eq('scheduled_date', dateStr)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (jobs.length < 2) {
      toast.error('At least 2 jobs required for route optimization');
      return;
    }

    setOptimizing(true);
    try {
      // Convert jobs to stops with coordinates
      const stops: Stop[] = jobs.map(job => {
        const coords = getApproxCoords(job.site_postcode);
        return {
          id: job.id,
          job_id: job.id,
          address: job.site_address,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      });

      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          stops,
          driver_id: driverId,
          vehicle_id: vehicleId,
          plan_date: format(selectedDate, 'yyyy-MM-dd'),
          roundtrip: false,
          save_plan: true,
        },
      });

      if (error) throw error;

      if (data.success) {
        setOptimizedRoute(data.route);
        onRouteOptimized?.(data.route);
        toast.success('Route optimized successfully!');
      } else {
        throw new Error(data.error || 'Optimization failed');
      }
    } catch (error: any) {
      console.error('Route optimization error:', error);
      toast.error(error.message || 'Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Route Optimizer
        </CardTitle>
        <CardDescription>
          Optimize delivery routes for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Jobs List */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Scheduled
          </h4>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No jobs scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.site_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.material_type} • {job.volume_tonnes} tonnes
                    </p>
                  </div>
                  <Badge variant="outline">{job.site_postcode || 'N/A'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optimize Button */}
        {jobs.length >= 2 && !optimizedRoute && (
          <Button
            onClick={handleOptimize}
            disabled={optimizing}
            className="w-full"
            size="lg"
          >
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Optimal Route...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>
        )}

        {/* Optimized Route Result */}
        {optimizedRoute && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Route Optimized!</span>
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <div className="text-2xl font-bold text-primary">
                  {optimizedRoute.distance_km} km
                </div>
                <div className="text-xs text-muted-foreground">Total Distance</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(optimizedRoute.duration_mins / 60)}h {optimizedRoute.duration_mins % 60}m
                </div>
                <div className="text-xs text-muted-foreground">Est. Duration</div>
              </div>
            </div>

            {/* Optimized Order */}
            <div>
              <h4 className="text-sm font-medium mb-3">Optimized Order</h4>
              <div className="space-y-2">
                {optimizedRoute.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-medium text-white">
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stop.address}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>ETA: {stop.eta}</span>
                        {index > 0 && (
                          <>
                            <span>•</span>
                            <span>{stop.distance_from_previous} km from previous</span>
                          </>
                        )}
                      </div>
                    </div>
                    {index < optimizedRoute.stops.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => setOptimizedRoute(null)}
              className="w-full"
            >
              Plan New Route
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteOptimizer;
