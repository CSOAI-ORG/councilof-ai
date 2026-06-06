import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { checkRateLimit, getClientIP, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Analytics-specific rate limit: 100 requests per minute (higher than default for batch events)
const ANALYTICS_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

interface AnalyticsEvent {
  event_type: string;
  event_name: string;
  properties?: Record<string, any>;
  page_path?: string;
  referrer?: string;
  session_id: string;
}

interface BatchRequest {
  events: AnalyticsEvent[];
  user_agent?: string;
  device_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`analytics:${clientIP}`, ANALYTICS_RATE_LIMIT);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[TRACK-ANALYTICS] Rate limit exceeded for IP: ${clientIP}`);
      return createRateLimitResponse(rateLimitResult.resetIn);
    }

    console.log('[TRACK-ANALYTICS] Request received, remaining:', rateLimitResult.remaining);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: BatchRequest = await req.json();
    const { events, user_agent, device_type } = body;

    // Validate request body
    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Events array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size to prevent abuse
    if (events.length > 50) {
      console.warn(`[TRACK-ANALYTICS] Batch size exceeded: ${events.length} events`);
      return new Response(
        JSON.stringify({ error: 'Maximum 50 events per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each event has required fields
    for (const event of events) {
      if (!event.session_id || !event.event_type || !event.event_name) {
        return new Response(
          JSON.stringify({ error: 'Each event requires session_id, event_type, and event_name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extract user ID from auth header if present
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Detect device type from user agent
    const detectedDevice = device_type || (
      user_agent?.toLowerCase().includes('mobile') ? 'mobile' :
      user_agent?.toLowerCase().includes('tablet') ? 'tablet' : 'desktop'
    );

    // Prepare events for insertion (strip PII, normalize data)
    const normalizedEvents = events.map(event => ({
      user_id: userId,
      session_id: event.session_id,
      event_type: event.event_type,
      event_name: event.event_name,
      properties: sanitizeProperties(event.properties || {}),
      page_path: event.page_path,
      referrer: event.referrer ? sanitizeReferrer(event.referrer) : null,
      user_agent: user_agent?.slice(0, 500), // Truncate
      device_type: detectedDevice,
      created_at: new Date().toISOString()
    }));

    // Batch insert events
    const { error } = await supabase.from('analytics_events').insert(normalizedEvents);

    if (error) {
      console.error('[TRACK-ANALYTICS] Insert error:', error);
      throw error;
    }

    console.log(`[TRACK-ANALYTICS] Tracked ${events.length} events`);

    // Update learning patterns asynchronously (non-blocking)
    updateLearningPatterns(supabase, normalizedEvents).catch(console.error);

    return new Response(
      JSON.stringify({ success: true, tracked: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TRACK-ANALYTICS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track events' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Sanitize properties to remove any PII
function sanitizeProperties(props: Record<string, any>): Record<string, any> {
  const piiFields = ['email', 'phone', 'name', 'address', 'postcode', 'ip'];
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();
    
    // Skip PII fields
    if (piiFields.some(pii => lowerKey.includes(pii))) {
      continue;
    }
    
    // Recursively sanitize objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeProperties(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Sanitize referrer to remove query params that might contain PII
function sanitizeReferrer(referrer: string): string {
  try {
    const url = new URL(referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return referrer.split('?')[0];
  }
}

// Update aggregated learning patterns
async function updateLearningPatterns(supabase: any, events: any[]) {
  // Group events by type for pattern learning
  const patterns: Record<string, { count: number; properties: any[] }> = {};
  
  for (const event of events) {
    const key = `${event.event_type}:${event.event_name}`;
    if (!patterns[key]) {
      patterns[key] = { count: 0, properties: [] };
    }
    patterns[key].count++;
    if (event.properties) {
      patterns[key].properties.push(event.properties);
    }
  }

  // Upsert patterns
  for (const [key, data] of Object.entries(patterns)) {
    const [patternType, patternKey] = key.split(':');
    
    await supabase.rpc('increment_pattern_count', {
      p_pattern_type: patternType,
      p_pattern_key: patternKey,
      p_count: data.count
    }).catch(() => {
      // Fallback: direct upsert if RPC doesn't exist
      supabase.from('ai_learning_patterns').upsert({
        pattern_type: patternType,
        pattern_key: patternKey,
        pattern_value: { sample_properties: data.properties.slice(0, 5) },
        occurrence_count: data.count,
        last_updated: new Date().toISOString()
      }, { onConflict: 'pattern_type,pattern_key' });
    });
  }
}
