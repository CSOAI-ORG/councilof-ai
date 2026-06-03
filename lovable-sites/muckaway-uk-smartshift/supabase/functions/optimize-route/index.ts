import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Stop {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  job_id?: string;
}

interface OptimizeRequest {
  stops: Stop[];
  driver_id?: string;
  vehicle_id?: string;
  plan_date: string;
  roundtrip?: boolean;
  save_plan?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('MAPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OptimizeRequest = await req.json();
    const { stops, driver_id, vehicle_id, plan_date, roundtrip = false, save_plan = true } = body;

    console.log('Optimizing route for', stops.length, 'stops');

    if (!stops || stops.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 stops required for route optimization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stops.length > 12) {
      return new Response(
        JSON.stringify({ error: 'Maximum 12 stops allowed for optimization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build coordinates string for Mapbox API
    const coordinates = stops
      .map(stop => `${stop.longitude},${stop.latitude}`)
      .join(';');

    // Call Mapbox Optimization API
    const mapboxUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=true&roundtrip=${roundtrip}&source=first&destination=last&access_token=${MAPBOX_ACCESS_TOKEN}`;

    console.log('Calling Mapbox Optimization API...');
    const mapboxResponse = await fetch(mapboxUrl);
    const mapboxData = await mapboxResponse.json();

    if (mapboxData.code !== 'Ok') {
      console.error('Mapbox API error:', mapboxData);
      return new Response(
        JSON.stringify({ error: 'Route optimization failed', details: mapboxData.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trip = mapboxData.trips[0];
    const waypoints = mapboxData.waypoints;

    // Calculate distance in km and duration in minutes
    const distanceKm = Math.round((trip.distance / 1000) * 10) / 10;
    const durationMins = Math.round(trip.duration / 60);

    // Build optimized stops with order and ETA
    let cumulativeTime = 0;
    const baseTime = new Date(`${plan_date}T09:00:00`);
    
    const optimizedStops = waypoints
      .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
      .map((wp: any, index: number) => {
        const originalStop = stops[wp.waypoint_index];
        
        // Calculate ETA based on cumulative leg durations
        if (index > 0) {
          const leg = trip.legs[index - 1];
          cumulativeTime += leg.duration;
        }
        
        const eta = new Date(baseTime.getTime() + cumulativeTime * 1000);
        const etaString = eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        return {
          order: index + 1,
          id: originalStop.id,
          job_id: originalStop.job_id,
          address: originalStop.address,
          latitude: wp.location[1],
          longitude: wp.location[0],
          eta: etaString,
          distance_from_previous: index > 0 ? Math.round((trip.legs[index - 1].distance / 1000) * 10) / 10 : 0,
          duration_from_previous: index > 0 ? Math.round(trip.legs[index - 1].duration / 60) : 0,
        };
      });

    // Build turn-by-turn directions
    const directions = trip.legs.flatMap((leg: any, legIndex: number) => 
      leg.steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
        type: step.maneuver.type,
      }))
    );

    const optimizedRoute = {
      stops: optimizedStops,
      geometry: trip.geometry,
      directions: directions,
    };

    let routePlanId = null;

    // Save to database if requested
    if (save_plan) {
      const { data: routePlan, error: insertError } = await supabase
        .from('route_plans')
        .insert({
          user_id: user.id,
          driver_id,
          vehicle_id,
          plan_date,
          optimized_route: optimizedRoute,
          total_distance_km: distanceKm,
          estimated_duration_mins: durationMins,
          status: 'planned',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error saving route plan:', insertError);
      } else {
        routePlanId = routePlan.id;
        console.log('Route plan saved with ID:', routePlanId);
      }
    }

    const response = {
      success: true,
      route_plan_id: routePlanId,
      route: {
        distance_km: distanceKm,
        duration_mins: durationMins,
        stops: optimizedStops,
        geometry: trip.geometry,
        directions: directions.slice(0, 20), // Limit directions in response
      },
    };

    console.log('Route optimization complete:', distanceKm, 'km,', durationMins, 'mins');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
