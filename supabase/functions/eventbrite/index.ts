import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache (per function instance) to reduce Eventbrite API calls.
// This helps avoid 429 rate limits when the UI refreshes or multiple users load the same data.
type CacheEntry = {
  ts: number;
  data: unknown;
  status: number;
};

const cache = new Map<string, CacheEntry>();

const getTtlMsForAction = (action: string) => {
  switch (action) {
    case "organizations":
      return 5 * 60 * 1000; // 5 min
    case "events":
      return 60 * 1000; // 1 min
    case "event_details":
      return 2 * 60 * 1000; // 2 min
    default:
      return 30 * 1000;
  }
};

const getCacheKey = (action: string, organizationId?: string | null, eventId?: string | null) =>
  `${action}|org:${organizationId ?? ""}|event:${eventId ?? ""}`;

const getCached = (key: string, ttlMs: number) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) return null;
  return entry;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKeyRaw = Deno.env.get("EVENTBRITE_API_KEY");
    const apiKey = apiKeyRaw?.trim();

    if (!apiKey) {
      console.error("EVENTBRITE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Eventbrite API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debug (safe): helps detect accidental whitespace/newlines in the token.
    if (apiKeyRaw !== apiKey) {
      console.warn("EVENTBRITE_API_KEY had leading/trailing whitespace; trimmed");
    }

    const url = new URL(req.url);

    // Support both query-string calls (GET) and JSON-body calls (POST via functions.invoke)
    let bodyParams: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try {
        bodyParams = await req.json();
      } catch {
        bodyParams = {};
      }
    }

    const action = (url.searchParams.get("action") || bodyParams?.action || "events") as string;
    const organizationId = (url.searchParams.get("organization_id") || bodyParams?.organization_id) as string | undefined;
    const eventId = (url.searchParams.get("event_id") || bodyParams?.event_id) as string | undefined;

    console.log(`Eventbrite action: ${action}, organizationId: ${organizationId}, eventId: ${eventId}`);

    let eventbriteUrl = "";
    const method = "GET";
    const body = null;

    switch (action) {
      case "organizations":
        // Get user's organizations
        eventbriteUrl = "https://www.eventbriteapi.com/v3/users/me/organizations/";
        break;
      
      case "events":
        // Get events for an organization (active + ended for recent past events)
        if (!organizationId) {
          return new Response(
            JSON.stringify({ error: "organization_id is required for events action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        eventbriteUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live,started,ended&order_by=start_desc&expand=venue,ticket_availability`;
        break;

      case "event_details":
        // Get single event details
        if (!eventId) {
          return new Response(
            JSON.stringify({ error: "event_id is required for event_details action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        eventbriteUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/?expand=venue,ticket_availability`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Fetching from Eventbrite: ${eventbriteUrl}`);

    const ttlMs = getTtlMsForAction(action);
    const cacheKey = getCacheKey(action, organizationId, eventId);

    const cached = getCached(cacheKey, ttlMs);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return new Response(JSON.stringify(cached.data), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    const response = await fetch(eventbriteUrl, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    // If we hit Eventbrite rate limiting, try to serve a stale cache entry (if any) to avoid blank screens.
    if (response.status === 429) {
      console.error("Eventbrite API rate limit (429)");
      const stale = cache.get(cacheKey);
      if (stale) {
        console.log(`Serving stale cache for: ${cacheKey}`);
        return new Response(JSON.stringify(stale.data), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Cache": "STALE",
          },
        });
      }
    }

    if (!response.ok) {
      console.error("Eventbrite API error:", data);
      return new Response(
        JSON.stringify({ error: data.error_description || "Eventbrite API error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache successful responses
    cache.set(cacheKey, { ts: Date.now(), data, status: response.status });

    console.log(`Eventbrite response received successfully`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
