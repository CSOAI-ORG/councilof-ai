import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, MapPin, Camera, Check, Clock, Navigation, 
  AlertTriangle, Signal, SignalZero, RefreshCw 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageCompression } from "@/hooks/useImageCompression";
import { DriverJobQueue } from "@/components/DriverJobQueue";

// Offline sync queue stored in localStorage
const OFFLINE_QUEUE_KEY = 'driver_offline_queue';

interface OfflineAction {
  id: string;
  type: 'status_update' | 'photo_upload' | 'gps_checkin';
  jobId: string;
  data: any;
  timestamp: string;
}

export default function Driver() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing pending updates...",
      });
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Changes will sync when connected",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending queue from localStorage
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (queue) {
      setPendingSync(JSON.parse(queue));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => setCurrentLocation(position.coords),
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Add action to offline queue
  const queueOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updatedQueue = [...pendingSync, newAction];
    setPendingSync(updatedQueue);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));

    toast({
      title: "Queued for Sync",
      description: "Action saved. Will sync when online.",
    });
  };

  // Sync offline queue
  const syncOfflineQueue = async () => {
    if (pendingSync.length === 0 || !isOnline) return;

    setIsSyncing(true);
    const failedActions: OfflineAction[] = [];

    for (const action of pendingSync) {
      try {
        switch (action.type) {
          case 'status_update':
            await supabase
              .from('job_assignments')
              .update({ status: action.data.status })
              .eq('job_id', action.jobId);
            break;
          case 'gps_checkin':
            // Log GPS check-in
            console.log('GPS check-in synced:', action.data);
            break;
          case 'photo_upload':
            // Photo uploads would go to storage
            console.log('Photo synced:', action.jobId);
            break;
        }
      } catch (error) {
        console.error('Sync failed for action:', action, error);
        failedActions.push(action);
      }
    }

    setPendingSync(failedActions);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedActions));
    setIsSyncing(false);

    if (failedActions.length === 0) {
      toast({
        title: "Sync Complete",
        description: `${pendingSync.length} updates synced successfully`,
      });
    } else {
      toast({
        title: "Partial Sync",
        description: `${failedActions.length} updates still pending`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Connection Status Banner */}
      <div className={`px-4 py-2 text-center text-sm font-medium ${
        isOnline ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isOnline ? (
            <>
              <Signal className="h-4 w-4" />
              <span>Online</span>
              {pendingSync.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-xs"
                  onClick={syncOfflineQueue}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync {pendingSync.length}
                </Button>
              )}
            </>
          ) : (
            <>
              <SignalZero className="h-4 w-4" />
              <span>Offline - {pendingSync.length} pending</span>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Driver App</h1>
              <p className="text-sm text-muted-foreground">
                {currentLocation 
                  ? `GPS: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : 'Acquiring GPS...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="today" className="text-base py-3">
              <Clock className="h-4 w-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-base py-3">
              <Navigation className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-base py-3">
              <Check className="h-4 w-4 mr-2" />
              Done
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <DriverJobQueue 
              filter="today"
              isOnline={isOnline}
              currentLocation={currentLocation}
              onQueueOfflineAction={queueOfflineAction}
            />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <DriverJobQueue 
              filter="upcoming"
              isOnline={isOnline}
              currentLocation={currentLocation}
              onQueueOfflineAction={queueOfflineAction}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <DriverJobQueue 
              filter="completed"
              isOnline={isOnline}
              currentLocation={currentLocation}
              onQueueOfflineAction={queueOfflineAction}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Beta Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-500/10 border-t border-amber-500/20 px-4 py-2">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Driver App Beta - Full offline sync Q1 2025
        </p>
      </div>
    </div>
  );
}
