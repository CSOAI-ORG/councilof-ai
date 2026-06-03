import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createCheckoutSchema, validateRequest, createValidationErrorResponse, type CreateCheckoutInput } from '../_shared/validation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Require authentication for checkout
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
    if (userError || !userData.user?.email) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const user = userData.user;
    const customerEmail = user.email;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validation = validateRequest(createCheckoutSchema, rawBody);
    if (!validation.success) {
      logStep("Validation failed", { error: validation.error });
      return createValidationErrorResponse(validation.error, corsHeaders);
    }

    const { 
      amount, 
      currency = "gbp", 
      jobData, 
      metadata = {},
      priceId,
      mode = "payment"
    } = validation.data;
    
    logStep("Request data received", { amount, currency, priceId, mode, jobData: !!jobData });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Build line items based on whether priceId is provided
    let lineItems;
    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
      logStep("Using existing price", { priceId });
    } else {
      // Sanitize jobData for product description
      const materialType = typeof jobData?.materialType === 'string' 
        ? jobData.materialType.substring(0, 100) 
        : 'Spoil Removal';
      const postcode = typeof jobData?.postcode === 'string' 
        ? jobData.postcode.substring(0, 20) 
        : 'Location TBC';

      lineItems = [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Muck Away Service - ${materialType}`,
              description: `Collection from ${postcode}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ];
      logStep("Using price_data for one-off payment");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: mode as "payment" | "subscription",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user?.id || "guest",
        job_data: jobData ? JSON.stringify(jobData).substring(0, 500) : "",
        ...metadata,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url, mode });

    // Store order in database for one-off payments
    if (mode === "payment" && jobData && user) {
      const { error: insertError } = await supabaseClient.from("orders").insert({
        user_id: user.id,
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        status: "pending",
        stripe_session_id: session.id,
      });

      if (insertError) {
        logStep("Error storing order", { error: insertError });
      } else {
        logStep("Order stored successfully");
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
