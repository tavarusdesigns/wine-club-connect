import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("EVENTBRITE_API_KEY");
    
    if (!apiKey) {
      console.error("EVENTBRITE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Eventbrite API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "events";
    const organizationId = url.searchParams.get("organization_id");
    const eventId = url.searchParams.get("event_id");

    console.log(`Eventbrite action: ${action}, organizationId: ${organizationId}, eventId: ${eventId}`);

    let eventbriteUrl = "";
    let method = "GET";
    let body = null;

    switch (action) {
      case "organizations":
        // Get user's organizations
        eventbriteUrl = "https://www.eventbriteapi.com/v3/users/me/organizations/";
        break;
      
      case "events":
        // Get events for an organization
        if (!organizationId) {
          return new Response(
            JSON.stringify({ error: "organization_id is required for events action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        eventbriteUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live,started&order_by=start_asc&expand=venue,ticket_availability`;
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

    const response = await fetch(eventbriteUrl, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Eventbrite API error:", data);
      return new Response(
        JSON.stringify({ error: data.error_description || "Eventbrite API error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Eventbrite response received successfully`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
