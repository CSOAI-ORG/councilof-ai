import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usage limits by tier
const TIER_LIMITS = {
  free: { jobs: 5, ai_requests: 10 },
  starter: { jobs: 50, ai_requests: 100 },
  professional: { jobs: 500, ai_requests: 1000 },
  enterprise: { jobs: -1, ai_requests: -1 }
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

    // Get current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get usage record for this period
    const { data: usageRecord } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', periodStart.toISOString())
      .lte('period_start', periodEnd.toISOString())
      .single();

    // TODO: Get user's actual subscription tier
    const userTier = 'starter';
    const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    const currentUsage = usageRecord || {
      jobs_count: 0,
      ai_requests_count: 0,
      storage_bytes_used: 0
    };

    // Calculate days remaining in period
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return new Response(
      JSON.stringify({
        usage: {
          jobs: {
            current: currentUsage.jobs_count,
            limit: limits.jobs,
            percentage: limits.jobs === -1 ? 0 : Math.round((currentUsage.jobs_count / limits.jobs) * 100)
          },
          ai_requests: {
            current: currentUsage.ai_requests_count,
            limit: limits.ai_requests,
            percentage: limits.ai_requests === -1 ? 0 : Math.round((currentUsage.ai_requests_count / limits.ai_requests) * 100)
          },
          storage: {
            bytes_used: currentUsage.storage_bytes_used,
            formatted: formatBytes(currentUsage.storage_bytes_used)
          }
        },
        tier: userTier,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          days_remaining: daysRemaining
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GET-USAGE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get usage' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
