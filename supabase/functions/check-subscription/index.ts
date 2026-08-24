import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUDDY_PRICE_ID = "price_1U81rtE1geDw4HorwUkDFTUa";
const MONTHLY_CREDITS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user?.email) return json({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ subscribed: false, plan: "free" });
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    if (!customerId) {
      await admin.rpc("sync_buddy_subscription", {
        _user_id: user.id,
        _status: "canceled",
        _expires_at: null,
      });
      return json({ subscribed: false, plan: "free" });
    }

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 5 });
    const buddySub = subs.data.find((s) =>
      s.items.data.some((i) => i.price.id === BUDDY_PRICE_ID)
    ) ?? subs.data[0];

    if (!buddySub) {
      await admin.rpc("sync_buddy_subscription", {
        _user_id: user.id,
        _status: "canceled",
        _expires_at: null,
        _stripe_customer_id: customerId,
      });
      return json({ subscribed: false, plan: "free" });
    }

    const periodEndSec =
      (buddySub as unknown as { current_period_end?: number }).current_period_end ??
      buddySub.items.data[0]?.current_period_end ??
      Math.floor(Date.now() / 1000) + 30 * 86400;
    const expiresAt = new Date(periodEndSec * 1000).toISOString();

    await admin.rpc("sync_buddy_subscription", {
      _user_id: user.id,
      _status: "active",
      _expires_at: expiresAt,
      _stripe_customer_id: customerId,
      _stripe_subscription_id: buddySub.id,
      _price_id: buddySub.items.data[0]?.price.id ?? BUDDY_PRICE_ID,
    });

    // Monthly credit allowance, idempotent per billing period
    const { data: granted } = await admin.rpc("grant_buddy_monthly_credits", {
      _user_id: user.id,
      _period: `${buddySub.id}:${periodEndSec}`,
      _amount: MONTHLY_CREDITS,
    });

    return json({
      subscribed: true,
      plan: "buddy",
      subscription_end: expiresAt,
      cancel_at_period_end: buddySub.cancel_at_period_end ?? false,
      credits_granted: typeof granted === "number" && granted >= 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[check-subscription] error", message);
    return json({ error: message }, 500);
  }
});
