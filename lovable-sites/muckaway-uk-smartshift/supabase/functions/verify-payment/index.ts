import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

// Stripe session ID format validation
const SESSION_ID_REGEX = /^cs_(?:test_|live_)[a-zA-Z0-9]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - rejecting request");
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: userData.user.id });

    const { sessionId } = await req.json();
    
    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!SESSION_ID_REGEX.test(sessionId)) {
      logStep("Invalid session ID format", { sessionId: sessionId.substring(0, 20) });
      return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Session ID received", { sessionId: sessionId.substring(0, 20) + "..." });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved from Stripe", { 
      paymentStatus: session.payment_status,
      status: session.status 
    });

    // Update order status in database
    if (session.payment_status === "paid") {
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", sessionId);

      if (updateError) {
        logStep("Error updating order status", { error: updateError });
      } else {
        logStep("Order status updated to completed");
      }

      // Trigger welcome email
      const customerEmail = session.customer_details?.email;
      const customerName = session.customer_details?.name;
      
      if (customerEmail) {
        try {
          const emailResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
              },
              body: JSON.stringify({
                user_id: userData.user.id,
                email: customerEmail,
                type: "welcome",
                data: {
                  name: customerName || "there",
                  tier: session.metadata?.tier || "Professional",
                  loginUrl: `${req.headers.get("origin")}/auth`,
                  dashboardUrl: `${req.headers.get("origin")}/dashboard`
                }
              })
            }
          );
          logStep("Welcome email triggered", { 
            success: emailResponse.ok, 
            email: customerEmail 
          });
        } catch (emailError) {
          logStep("Failed to trigger welcome email", { 
            error: emailError instanceof Error ? emailError.message : String(emailError) 
          });
        }
      }
    }

    return new Response(JSON.stringify({
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
