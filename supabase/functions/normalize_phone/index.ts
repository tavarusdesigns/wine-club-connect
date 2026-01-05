import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(input: string): string | null {
  const digits = (input.match(/\d/g) || []).join("");
  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  return "+" + digits; // fallback
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, user_id } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "phone required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);

    if (user_id) {
      const url = new URL(req.url);
      const sbUrl = url.origin.replace("/functions/v1/normalize_phone", "");
      // This function expects Supabase Service Key via Authorization header when updating
      const auth = req.headers.get("authorization") || req.headers.get("Authorization");
      if (!auth) {
        return new Response(JSON.stringify({ phone: normalized }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data, error } = await fetch(`${sbUrl}/rest/v1/profiles?user_id=eq.${user_id}`, {
        method: "PATCH",
        headers: {
          "Authorization": auth,
          "apikey": auth.replace(/^(Bearer )?/, ""),
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ phone: normalized })
      }).then(async (r) => ({ data: await r.json(), error: r.ok ? null : r.statusText }));

      if (error) {
        return new Response(JSON.stringify({ phone: normalized, error }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ phone: normalized, profile: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ phone: normalized }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});