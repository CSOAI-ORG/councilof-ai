import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-JOB-PAYMENT] ${step}${detailsStr}`);
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Input validation
const validateInput = (data: any) => {
  const errors: string[] = [];

  if (!data.jobId || typeof data.jobId !== 'string' || !UUID_REGEX.test(data.jobId)) {
    errors.push("Invalid jobId format - must be a valid UUID");
  }

  if (data.amount === undefined || typeof data.amount !== 'number' || data.amount <= 0 || data.amount > 1000000) {
    errors.push("Amount must be a positive number less than 1,000,000");
  }

  return errors;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const requestData = await req.json();
    
    // Validate input
    const validationErrors = validateInput(requestData);
    if (validationErrors.length > 0) {
      logStep("Validation failed", { errors: validationErrors });
      return new Response(JSON.stringify({ error: validationErrors.join(", ") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { jobId, amount, jobDetails } = requestData;
    logStep("Request received", { jobId, amount, jobDetails: !!jobDetails });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will create during checkout");
    }

    // Sanitize job details for display
    const material = typeof jobDetails?.material === 'string' 
      ? jobDetails.material.substring(0, 50) 
      : 'Spoil Removal';
    const volume = typeof jobDetails?.volume === 'number' 
      ? jobDetails.volume 
      : 0;
    const postcode = typeof jobDetails?.postcode === 'string' 
      ? jobDetails.postcode.substring(0, 20) 
      : 'Location TBC';

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Muck Away Job - ${material}`,
              description: `${volume}m³ - ${postcode}`,
              metadata: {
                job_id: jobId,
              },
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`,
      cancel_url: `${req.headers.get("origin")}/dashboard`,
      metadata: {
        job_id: jobId,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update job with payment session ID
    const { error: updateError } = await supabaseClient
      .from("jobs")
      .update({ 
        payment_session_id: session.id,
        payment_status: "pending"
      })
      .eq("id", jobId);

    if (updateError) {
      logStep("Warning: Could not update job with payment session", { error: updateError });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
