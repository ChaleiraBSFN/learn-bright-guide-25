import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUDDY_PRICE_ID = "price_1U81rtE1geDw4HorwUkDFTUa";

// Moedas com preço configurado em currency_options do price no Stripe.
const SUPPORTED_CURRENCIES = ["brl", "usd", "eur", "jpy", "cny"];



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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user?.email) return json({ error: "Invalid session" }, 401);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "https://studdybuddy.com.br";

    let currency = "brl";
    try {
      const body = await req.json();
      const requested = String(body?.currency ?? "").toLowerCase();
      if (SUPPORTED_CURRENCIES.includes(requested)) currency = requested;
    } catch {
      // sem corpo: mantém BRL
    }

    // O price tem currency_options (brl/usd/eur/jpy/cny); "currency" escolhe qual usar.
    // adaptive_pricing desligado para o Stripe não trocar a moeda pela localização do comprador.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: BUDDY_PRICE_ID, quantity: 1 }],
      currency,
      adaptive_pricing: { enabled: false },
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${origin}/buddy?checkout=success`,
      cancel_url: `${origin}/buddy?checkout=cancel`,
    });

    return json({ url: session.url, currency });


  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[create-checkout] error", message);
    return json({ error: message }, 500);
  }
});
