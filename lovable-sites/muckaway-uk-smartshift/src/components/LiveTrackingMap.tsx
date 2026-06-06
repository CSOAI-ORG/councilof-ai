import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, Gauge, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface VehicleLocation {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

interface Vehicle {
  id: string;
  registration: string;
  vehicle_type: string | null;
  active: boolean;
}

interface OptimizedStop {
  job_id: string;
  address: string;
  eta: string;
  sequence: number;
  lat: number;
  lon: number;
}

interface RouteResult {
  total_distance_km: number;
  total_duration_mins: number;
  optimized_stops: OptimizedStop[];
  geometry?: {
    type: string;
    coordinates: number[][];
  };
}

interface LiveTrackingMapProps {
  optimizedRoute?: RouteResult | null;
}

export function LiveTrackingMap({ optimizedRoute }: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const routeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setMapError('Failed to load map token');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setMapError('Unable to load map. Please try again later.');
      }
    };
    fetchToken();
  }, []);

  // Fetch vehicle data
  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [vehiclesResult, locationsResult] = await Promise.all([
        supabase.from('vehicles').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('vehicle_locations').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false })
      ]);

      if (vehiclesResult.data) setVehicles(vehiclesResult.data);
      
      if (locationsResult.data) {
        const latestLocations = new Map<string, VehicleLocation>();
        locationsResult.data.forEach(loc => {
          if (!latestLocations.has(loc.vehicle_id)) {
            latestLocations.set(loc.vehicle_id, loc);
          }
        });
        setVehicleLocations(Array.from(latestLocations.values()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('vehicle-locations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vehicle_locations'
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newLocation = payload.new as VehicleLocation;
          setVehicleLocations(prev => {
            const filtered = prev.filter(loc => loc.vehicle_id !== newLocation.vehicle_id);
            return [...filtered, newLocation];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-0.1278, 51.5074], // London default
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      // Add route source
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // Add route layer
      map.current?.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-dasharray': [2, 1]
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers that no longer exist
    markersRef.current.forEach((marker, vehicleId) => {
      if (!vehicleLocations.find(loc => loc.vehicle_id === vehicleId)) {
        marker.remove();
        markersRef.current.delete(vehicleId);
      }
    });

    // Update or create markers
    vehicleLocations.forEach(location => {
      const vehicle = vehicles.find(v => v.id === location.vehicle_id);
      if (!vehicle) return;

      const speed = location.speed || 0;
      const isMoving = speed > 5;
      const isFast = speed > 30;
      
      // Determine marker color based on status
      let markerColor = '#ef4444'; // Red - stationary
      if (isFast) markerColor = '#22c55e'; // Green - moving fast
      else if (isMoving) markerColor = '#eab308'; // Yellow - slow

      const existingMarker = markersRef.current.get(location.vehicle_id);
      
      if (existingMarker) {
        // Update position with animation
        existingMarker.setLngLat([location.longitude, location.latitude]);
        
        // Update marker color
        const el = existingMarker.getElement();
        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.fill = markerColor;
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${markerColor}" stroke="white" stroke-width="1.5">
            <path d="M10 17h4V5H10v12zm-6 0h4V9H4v8zm12 0h4v-5h-4v5z"/>
          </svg>
          <div style="background: hsl(var(--background)); color: hsl(var(--foreground)); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; margin-top: 2px; border: 1px solid hsl(var(--border));">
            ${vehicle.registration}
          </div>
        `;
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong>${vehicle.registration}</strong><br/>
            <span>${vehicle.vehicle_type || 'Vehicle'}</span><br/>
            <span>Speed: ${speed.toFixed(1)} km/h</span><br/>
            <span>Last update: ${format(new Date(location.recorded_at), 'HH:mm:ss')}</span>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          setSelectedVehicle(location.vehicle_id);
          map.current?.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 14,
            duration: 1000
          });
        });

        markersRef.current.set(location.vehicle_id, marker);
      }
    });

    // Fit bounds to show all vehicles if there are multiple
    if (vehicleLocations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      vehicleLocations.forEach(loc => {
        bounds.extend([loc.longitude, loc.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else if (vehicleLocations.length === 1) {
      map.current.flyTo({
        center: [vehicleLocations[0].longitude, vehicleLocations[0].latitude],
        zoom: 12
      });
    }
  }, [vehicleLocations, vehicles]);

  // Update route display
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Clear existing route markers
    routeMarkersRef.current.forEach(marker => marker.remove());
    routeMarkersRef.current = [];

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    
    if (optimizedRoute?.geometry && source) {
      // Update route line
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: optimizedRoute.geometry as GeoJSON.Geometry
      });

      // Add stop markers
      optimizedRoute.optimized_stops.forEach((stop, index) => {
        const el = document.createElement('div');
        el.className = 'stop-marker';
        el.innerHTML = `
          <div style="
            width: 28px;
            height: 28px;
            background: hsl(48, 96%, 53%);
            color: black;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${index + 1}</div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
          <div style="padding: 8px;">
            <strong>Stop ${index + 1}</strong><br/>
            <span>${stop.address}</span><br/>
            <span>ETA: ${stop.eta}</span>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([stop.lon, stop.lat])
          .setPopup(popup)
          .addTo(map.current!);

        routeMarkersRef.current.push(marker);
      });

      // Fit bounds to route
      if (optimizedRoute.geometry.coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        optimizedRoute.geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } else if (source) {
      // Clear route
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  }, [optimizedRoute]);

  const getLocationForVehicle = (vehicleId: string) => {
    return vehicleLocations.find(loc => loc.vehicle_id === vehicleId);
  };

  const getSpeedColor = (speed: number | null) => {
    if (!speed || speed < 5) return 'bg-red-500';
    if (speed < 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusLabel = (speed: number | null) => {
    if (!speed || speed < 5) return 'Stationary';
    if (speed < 30) return 'Slow';
    return 'Moving';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mapError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">Map Error</p>
              <p className="text-sm text-muted-foreground">{mapError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Live Fleet Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={mapContainer} 
              className="h-[500px] rounded-b-lg"
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active vehicles</p>
            ) : (
              <div className="space-y-3">
                {vehicles.map(vehicle => {
                  const location = getLocationForVehicle(vehicle.id);
                  const speed = location?.speed || 0;
                  const isSelected = selectedVehicle === vehicle.id;

                  return (
                    <div 
                      key={vehicle.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedVehicle(vehicle.id);
                        if (location && map.current) {
                          map.current.flyTo({
                            center: [location.longitude, location.latitude],
                            zoom: 14,
                            duration: 1000
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{vehicle.registration}</span>
                        <Badge variant="outline" className="text-xs">
                          {vehicle.vehicle_type || 'Vehicle'}
                        </Badge>
                      </div>
                      
                      {location ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getSpeedColor(speed)}`} />
                            <span className="text-muted-foreground">{getStatusLabel(speed)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Gauge className="h-3 w-3" />
                            <span>{speed.toFixed(1)} km/h</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(location.recorded_at), 'HH:mm:ss')}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No location data</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {optimizedRoute && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{optimizedRoute.total_distance_km.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{optimizedRoute.total_duration_mins} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stops</span>
                  <span className="font-medium">{optimizedRoute.optimized_stops.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default LiveTrackingMap;
