import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageMap: Record<string, string> = {
  "pt-BR": "Portuguese", en: "English", es: "Spanish", fr: "French",
  de: "German", it: "Italian", ja: "Japanese", zh: "Chinese", ru: "Russian",
};

async function callGemini(prompt: string, apiKey: string): Promise<string | null> {
  // Use fastest model first for speed
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  for (const model of models) {
    try {
      console.log(`[Translate] Trying ${model}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.1, 
              maxOutputTokens: 8192, 
              responseMimeType: "application/json" 
            },
          }),
        }
      );
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { console.log(`[Translate] Success with ${model}`); return text; }
      }
      if (response.status === 429) { console.log(`[Translate] ${model} rate limited`); continue; }
    } catch (e) { console.error(`[Translate] ${model}:`, e.message); }
  }
  return null;
}

function parseJson(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  
  try { return JSON.parse(cleaned); } catch (_) {}
  
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error("No JSON object found");
  
  let depth = 0, inString = false, escape = false, end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  
  if (end === -1) throw new Error("Unmatched braces");
  return JSON.parse(cleaned.slice(start, end + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, targetLanguage } = await req.json();
    
    if (!content || !targetLanguage) {
      return new Response(JSON.stringify({ error: "Missing content or targetLanguage" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "Translation service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = languageMap[targetLanguage] || targetLanguage;
    const contentJson = JSON.stringify(content);

    // Detect if content involves learning a foreign language (e.g., "learn Russian words")
    // In such cases, the target language words/examples must be preserved in their original language
    const prompt = `Translate all string values to ${lang}. Keep JSON keys unchanged. Keep structure, numbers, booleans, emojis unchanged. Output valid JSON only.

IMPORTANT RULE: If the content is about learning a foreign language (e.g., learning Russian, Japanese, Chinese words), you must:
- Translate explanations, concepts, titles, and descriptions to ${lang}
- BUT keep the foreign language words, examples, vocabulary, and phrases in their ORIGINAL language (the language being studied)
- For example: if content teaches Russian words, translate explanations to ${lang} but keep Russian words in Russian (Cyrillic)
- This applies to ANY language being taught - always preserve the target study language's words/examples

${contentJson}`;

    const result = await callGemini(prompt, geminiKey);
    if (!result) {
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translated = parseJson(result);
    return new Response(JSON.stringify(translated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Translate] Error:", error.message);
    return new Response(JSON.stringify({ error: "Translation error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
