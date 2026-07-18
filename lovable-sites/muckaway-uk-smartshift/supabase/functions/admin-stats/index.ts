import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total jobs count
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    // Get jobs this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: jobsThisMonth } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // Get total quotes
    const { count: totalQuotes } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    // Get AI interactions this month
    const { count: aiInteractionsThisMonth } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    // Get recent signups (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: recentSignups } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get analytics events count today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { count: eventsToday } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Get total vehicles
    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });

    // Get total drivers
    const { count: totalDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true });

    console.log('[ADMIN-STATS] Stats fetched by admin:', user.id);

    return new Response(
      JSON.stringify({
        users: {
          total: totalUsers || 0,
          recent_signups: recentSignups || 0
        },
        jobs: {
          total: totalJobs || 0,
          this_month: jobsThisMonth || 0
        },
        quotes: {
          total: totalQuotes || 0
        },
        ai: {
          interactions_this_month: aiInteractionsThisMonth || 0
        },
        fleet: {
          vehicles: totalVehicles || 0,
          drivers: totalDrivers || 0
        },
        activity: {
          events_today: eventsToday || 0
        },
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ADMIN-STATS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get admin stats' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
