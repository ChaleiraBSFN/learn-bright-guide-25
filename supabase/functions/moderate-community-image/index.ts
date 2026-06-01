import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callGemini(prompt: string, mimeType: string, data: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data } }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 100, responseMimeType: "application/json" },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const j = await res.json();
        const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (_) { /* try next */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth required
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
      _user_id: user.id, _endpoint: "moderate-community-image", _max_requests: 30, _window_minutes: 60,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const imageBase64: string | undefined = body.imageBase64;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (imageBase64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image too large" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let mimeType = "image/jpeg";
    let data = imageBase64;
    if (imageBase64.startsWith("data:")) {
      const m = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/);
      if (m) { mimeType = m[1]; data = m[2]; }
    }

    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY") || "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Moderation service unavailable" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `Analyze this image for a public educational community feed.
Return ONLY this JSON: {"safe": boolean, "reason": "short reason if unsafe, empty if safe"}

Mark as UNSAFE (safe: false) if the image contains:
- Nudity, sexual content, suggestive poses
- Graphic violence, gore, blood
- Hate symbols, extremist content
- Drugs, alcohol, weapons
- Personal documents with sensitive info (ID, credit cards)
- Anything obscene or inappropriate for minors

Mark as SAFE (safe: true) for: study materials, exercises, notebooks, books, classroom photos, diagrams, equations, text, screenshots of educational content.`;

    const raw = await callGemini(prompt, mimeType, data, apiKey);
    if (!raw) {
      // Fail-closed: when moderation cannot run, reject to be safe.
      return new Response(JSON.stringify({ safe: false, reason: "Moderation service unavailable. Try again later." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsed: { safe?: boolean; reason?: string } = {};
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { safe: false, reason: "Could not analyze image" };
    }

    return new Response(JSON.stringify({ safe: !!parsed.safe, reason: parsed.reason || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("moderate error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
