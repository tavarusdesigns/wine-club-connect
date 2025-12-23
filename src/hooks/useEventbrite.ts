import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string } | null;
  start: { local: string; utc: string };
  end: { local: string; utc: string };
  url: string;
  venue?: {
    name: string;
    address: {
      localized_address_display: string;
    };
  };
  logo?: { url: string } | null;
  ticket_availability?: {
    is_sold_out: boolean;
    has_available_tickets: boolean;
    minimum_ticket_price?: { display: string };
  };
}

interface EventbriteOrganization {
  id: string;
  name: string;
}

export const useEventbrite = (organizationId?: string) => {
  const [events, setEvents] = useState<EventbriteEvent[]>([]);
  const [organizations, setOrganizations] = useState<EventbriteOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("eventbrite", {
        body: {},
        headers: {},
      });

      // The invoke method with query params requires using the path differently
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eventbrite?action=organizations`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch organizations");
      }

      setOrganizations(result.organizations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch organizations";
      setError(message);
      console.error("Eventbrite organizations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (orgId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eventbrite?action=events&organization_id=${orgId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch events");
      }

      setEvents(result.events || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
      console.error("Eventbrite events error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchEvents(organizationId);
    }
  }, [organizationId]);

  return {
    events,
    organizations,
    loading,
    error,
    fetchOrganizations,
    fetchEvents,
    refetch: () => organizationId && fetchEvents(organizationId),
  };
};

// Format Eventbrite event for display
export const formatEventbriteEvent = (event: EventbriteEvent) => {
  const startDate = new Date(event.start.local);
  
  return {
    id: event.id,
    title: event.name.text,
    date: startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    location: event.venue?.name || event.venue?.address?.localized_address_display || "TBA",
    image: event.logo?.url || null,
    url: event.url,
    isSoldOut: event.ticket_availability?.is_sold_out || false,
    hasAvailableTickets: event.ticket_availability?.has_available_tickets ?? true,
    price: event.ticket_availability?.minimum_ticket_price?.display || "Free",
  };
};
