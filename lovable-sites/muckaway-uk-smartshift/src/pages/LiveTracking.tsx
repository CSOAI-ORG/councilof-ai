import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Route } from 'lucide-react';
import { SuspendedLiveTrackingMap, SuspendedRouteOptimizer } from '@/components/LazyComponents';

// Match the RouteOptimizer's RouteResult type
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

// Transformed route for the map component
interface MapRoute {
  total_distance_km: number;
  total_duration_mins: number;
  optimized_stops: {
    job_id: string;
    address: string;
    eta: string;
    sequence: number;
    lat: number;
    lon: number;
  }[];
  geometry?: {
    type: string;
    coordinates: number[][];
  };
}

export default function LiveTracking() {
  const [currentRoute, setCurrentRoute] = useState<MapRoute | null>(null);

  const handleRouteOptimized = (route: RouteResult) => {
    // Transform RouteOptimizer output to LiveTrackingMap format
    const mapRoute: MapRoute = {
      total_distance_km: route.distance_km,
      total_duration_mins: route.duration_mins,
      optimized_stops: route.stops.map((stop, index) => ({
        job_id: stop.job_id || stop.id,
        address: stop.address,
        eta: stop.eta,
        sequence: index + 1,
        lat: stop.latitude,
        lon: stop.longitude,
      })),
      geometry: route.geometry,
    };
    setCurrentRoute(mapRoute);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Live Fleet Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your vehicles in real-time with GPS tracking
          </p>
        </div>
        
        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route Planner
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracking">
            <SuspendedLiveTrackingMap optimizedRoute={currentRoute} />
          </TabsContent>
          
          <TabsContent value="route">
            <div className="max-w-2xl">
              <SuspendedRouteOptimizer onRouteOptimized={handleRouteOptimized} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
