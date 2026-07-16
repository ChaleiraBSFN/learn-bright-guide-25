import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DAILY_LIMIT = 3;
const CREDITS_PER_AD = 25;
const MIN_SECONDS_BETWEEN = 18;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Anti-abuse: last watched must be > MIN_SECONDS_BETWEEN ago
    const { data: lastRow } = await admin
      .from("ad_rewards")
      .select("watched_at")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRow?.watched_at) {
      const diff = (Date.now() - new Date(lastRow.watched_at).getTime()) / 1000;
      if (diff < MIN_SECONDS_BETWEEN) {
        return new Response(
          JSON.stringify({ error: "Too fast. Watch the full ad." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Count today (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("ad_rewards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("watched_at", since);

    const usedToday = count ?? 0;
    if (usedToday >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "daily_limit",
          used_today: usedToday,
          limit: DAILY_LIMIT,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert reward row
    const { error: insErr } = await admin.from("ad_rewards").insert({
      user_id: userId,
      credits_granted: CREDITS_PER_AD,
    });
    if (insErr) throw insErr;

    // Add credits
    const { data: newBalance, error: creditErr } = await admin.rpc(
      "add_credits",
      { _user_id: userId, _amount: CREDITS_PER_AD },
    );
    if (creditErr) throw creditErr;

    return new Response(
      JSON.stringify({
        success: true,
        credits_remaining: newBalance,
        credits_granted: CREDITS_PER_AD,
        used_today: usedToday + 1,
        limit: DAILY_LIMIT,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("claim-ad-reward error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
