import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency_ms?: number; error?: string };
    stripe: { status: string; mode?: string; error?: string };
    secrets: { status: string; configured: string[]; missing: string[] };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "unknown" },
      stripe: { status: "unknown" },
      secrets: { status: "unknown", configured: [], missing: [] },
    },
  };

  // Check required secrets
  const requiredSecrets = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
  ];
  
  const configuredSecrets: string[] = [];
  const missingSecrets: string[] = [];
  
  for (const secret of requiredSecrets) {
    if (Deno.env.get(secret)) {
      configuredSecrets.push(secret);
    } else {
      missingSecrets.push(secret);
    }
  }
  
  health.checks.secrets = {
    status: missingSecrets.length === 0 ? "ok" : "error",
    configured: configuredSecrets,
    missing: missingSecrets,
  };
  
  if (missingSecrets.length > 0) {
    health.status = "unhealthy";
  }

  // Check database connectivity
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const startTime = Date.now();
      
      const { error } = await supabase.from("profiles").select("id").limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) {
        health.checks.database = { status: "error", error: error.message, latency_ms: latency };
        health.status = "degraded";
      } else {
        health.checks.database = { status: "ok", latency_ms: latency };
      }
    } else {
      health.checks.database = { status: "error", error: "Missing Supabase credentials" };
      health.status = "unhealthy";
    }
  } catch (error) {
    health.checks.database = { status: "error", error: error instanceof Error ? error.message : String(error) };
    health.status = "unhealthy";
  }

  // Check Stripe connectivity
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const account = await stripe.accounts.retrieve();
      
      const isLiveMode = !stripeKey.startsWith("sk_test_");
      
      health.checks.stripe = {
        status: "ok",
        mode: isLiveMode ? "live" : "test",
      };
    } else {
      health.checks.stripe = { status: "error", error: "Missing Stripe secret key" };
      health.status = "unhealthy";
    }
  } catch (error) {
    health.checks.stripe = { status: "error", error: error instanceof Error ? error.message : String(error) };
    health.status = "degraded";
  }

  // Determine overall status
  const allOk = Object.values(health.checks).every((check) => check.status === "ok");
  const anyUnhealthy = Object.values(health.checks).some((check) => check.status === "error");
  
  if (allOk) {
    health.status = "healthy";
  } else if (anyUnhealthy) {
    health.status = health.checks.database.status === "error" || health.checks.secrets.status === "error" 
      ? "unhealthy" 
      : "degraded";
  }

  const httpStatus = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: httpStatus,
  });
});
