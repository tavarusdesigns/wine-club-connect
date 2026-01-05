import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractLinks(html: string): Array<{ title: string; url: string }> {
  const results: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  // Find event links like https://www.eventbrite.com/e/<slug>-<id>
  const anchorRegex = /<a\s+[^>]*href=["']([^"']*\/e\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html))) {
    const href = match[1];
    let text = match[2] || "";
    // Strip tags inside
    text = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    // Normalize absolute URL
    const url = href.startsWith("http") ? href : `https://www.eventbrite.com${href}`;
    // De-dupe by URL
    const key = url.replace(/[?#].*$/, "");
    if (!seen.has(key)) {
      seen.add(key);
      // Basic guard to avoid nav links
      if (/\/e\//.test(key)) {
        results.push({ title: text || "Event", url });
      }
    }
    if (results.length >= 50) break; // safety cap
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { url } = await req.json().catch(() => ({ url: null }));
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `failed to fetch organizer page: ${res.status}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const html = await res.text();
    const events = extractLinks(html);
    return new Response(JSON.stringify({ events }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
