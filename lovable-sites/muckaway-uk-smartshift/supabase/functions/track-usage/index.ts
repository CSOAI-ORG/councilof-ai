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
  enterprise: { jobs: -1, ai_requests: -1 } // -1 = unlimited
};

interface TrackUsageRequest {
  usage_type: 'job' | 'ai_request';
  increment?: number;
}

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

    const body: TrackUsageRequest = await req.json();
    const { usage_type, increment = 1 } = body;

    if (!['job', 'ai_request'].includes(usage_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid usage_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current billing period (first of current month to last)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get or create usage record for this period
    const { data: existingUsage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', periodStart.toISOString())
      .lte('period_start', periodEnd.toISOString())
      .single();

    let usageRecord = existingUsage;

    if (!usageRecord) {
      // Create new usage record for this period
      const { data: newUsage, error: insertError } = await supabase
        .from('usage_records')
        .insert({
          user_id: user.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          jobs_count: 0,
          ai_requests_count: 0,
          storage_bytes_used: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('[TRACK-USAGE] Insert error:', insertError);
        throw insertError;
      }
      usageRecord = newUsage;
    }

    // TODO: Get user's subscription tier from check-subscription
    // For now, default to 'starter' tier
    const userTier = 'starter';
    const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    // Check if user is within limits
    const currentCount = usage_type === 'job' ? usageRecord.jobs_count : usageRecord.ai_requests_count;
    const limit = usage_type === 'job' ? limits.jobs : limits.ai_requests;

    if (limit !== -1 && currentCount + increment > limit) {
      return new Response(
        JSON.stringify({
          error: 'Usage limit exceeded',
          current: currentCount,
          limit: limit,
          tier: userTier,
          upgrade_required: true
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage
    const updateField = usage_type === 'job' ? 'jobs_count' : 'ai_requests_count';
    const { data: updatedUsage, error: updateError } = await supabase
      .from('usage_records')
      .update({ [updateField]: currentCount + increment })
      .eq('id', usageRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('[TRACK-USAGE] Update error:', updateError);
      throw updateError;
    }

    console.log(`[TRACK-USAGE] User ${user.id} - ${usage_type}: ${currentCount + increment}/${limit}`);

    return new Response(
      JSON.stringify({
        success: true,
        usage: {
          jobs: { current: updatedUsage.jobs_count, limit: limits.jobs },
          ai_requests: { current: updatedUsage.ai_requests_count, limit: limits.ai_requests }
        },
        tier: userTier,
        period_end: periodEnd.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TRACK-USAGE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track usage' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
