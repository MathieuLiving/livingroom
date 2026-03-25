import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Task 1: Disable the function early
  return json(
    { 
      error: "Service Unavailable", 
      message: "The checkout function is currently disabled. Please try again later or contact support." 
    }, 
    503
  );

  /* 
    The remaining logic is preserved below but will not be executed 
    due to the early return above.
  */
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // 1. Initialize environment & clients
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://livingroom.immo";

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing required environment variables.");
      return json({ error: "Internal server error: Missing configuration" }, 500);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 3. Parse request
    const body = await req.json();
    const { plan_code } = body;

    if (!plan_code) {
      return json({ error: "Missing plan_code" }, 400);
    }

    // 4. Define Mappings
    const PRICE_IDS: Record<string, string | undefined> = {
      premium_plus: Deno.env.get("STRIPE_PRICE_PREMIUM_PLUS"),
      agency_s: Deno.env.get("STRIPE_PRICE_AGENCY_S"),
      agency_m: Deno.env.get("STRIPE_PRICE_AGENCY_M"),
      agency_l: Deno.env.get("STRIPE_PRICE_AGENCY_L"),
    };

    const priceId = PRICE_IDS[plan_code];
    if (!priceId) {
      return json({ error: "Invalid or unsupported plan_code" }, 400);
    }

    const PLAN_ACCESS: Record<string, string> = {
      premium_plus: "premium",
      agency_s: "premium",
      agency_m: "premium",
      agency_l: "premium",
    };
    const accessPlan = PLAN_ACCESS[plan_code];

    // 5. Fetch Professional Profile
    const { data: proProfile, error: proError } = await supabase
      .from("professionnels")
      .select("id, user_id, email, agency_id, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (proError || !proProfile) {
      console.error("Pro profile error:", proError);
      return json({ error: "Professional profile not found" }, 404);
    }

    // Validate agency plans
    if (plan_code.startsWith("agency_") && !proProfile.agency_id) {
      return json({ error: "Agency plan requires an associated agency_id" }, 400);
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/mon-abonnement?checkout=success`,
      cancel_url: `${APP_URL}/mon-abonnement?checkout=cancel`,
      customer_email: proProfile.email || user.email,
      allow_promotion_codes: true,
      client_reference_id: proProfile.id,
      metadata: {
        user_id: user.id,
        professionnel_id: proProfile.id,
        agency_id: proProfile.agency_id || "",
        plan_code: plan_code,
        access_plan: accessPlan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          professionnel_id: proProfile.id,
          agency_id: proProfile.agency_id || "",
          plan_code: plan_code,
          access_plan: accessPlan,
        },
      },
    });

    if (!session.url) {
      throw new Error("Failed to generate checkout session URL");
    }

    return json({ url: session.url, id: session.id });

  } catch (error: any) {
    console.error("Checkout session creation error:", error);
    return json({ error: error.message || "Internal server error" }, 500);
  }
});