import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description: { text: string } | null;
  start: { local: string; utc: string };
  end: { local: string; utc: string };
  status: string;
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

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("eventbrite", {
        body: { action: "organizations" },
      });

      if (error) throw error;

      const orgs = ((data as any)?.organizations ?? []) as EventbriteOrganization[];
      // Only use the Cabernet Steakhouse organization
      const cabernetOrgs = orgs.filter((o) => o.name === "Cabernet Steakhouse");

      if (cabernetOrgs.length === 0) {
        setOrganizations([]);
        const message = "No accessible organization named 'Cabernet Steakhouse' was found for this token.";
        setError(message);
        toast.error("Could not find Cabernet Steakhouse", { description: message });
        return;
      }

      setOrganizations(cabernetOrgs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch organizations";
      setError(message);
      console.error("Eventbrite organizations error:", err);
      toast.error("Could not load organizations", { description: message });

      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchEvents = useCallback(async (orgId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("eventbrite", {
        body: { action: "events", organization_id: orgId },
      });

      if (error) throw error;

      const allEvents: EventbriteEvent[] = (data as any)?.events || [];
      const now = new Date();

      // Separate active and past events
      const activeEvents = allEvents.filter(
        (e) => e.status === "live" || e.status === "started" || new Date(e.end.utc) > now
      );
      const pastEvents = allEvents
        .filter((e) => e.status === "ended" || new Date(e.end.utc) <= now)
        .sort((a, b) => new Date(b.end.utc).getTime() - new Date(a.end.utc).getTime())
        .slice(0, 2); // Only 2 most recent past events

      // Combine: active first (sorted by start date), then past
      const combinedEvents = [
        ...activeEvents.sort(
          (a, b) => new Date(a.start.utc).getTime() - new Date(b.start.utc).getTime()
        ),
        ...pastEvents,
      ];

      setEvents(combinedEvents);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
      console.error("Eventbrite events error:", err);
      toast.error("Could not load events", { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchEvents(organizationId);
    }
  }, [organizationId, fetchEvents]);

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
  const endDate = new Date(event.end.utc);
  const now = new Date();
  const isPast = event.status === "ended" || endDate <= now;
  
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
    isPast,
  };
};
