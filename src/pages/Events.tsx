import { motion } from "framer-motion";
import { Search, Filter, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import EventCard from "@/components/cards/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEventbrite, formatEventbriteEvent } from "@/hooks/useEventbrite";
const DEFAULT_ORG_ID = import.meta.env.VITE_EVENTBRITE_ORG_ID as string | undefined;

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>(DEFAULT_ORG_ID || "");
  const [showAllEvents, setShowAllEvents] = useState(false);

  const { events, loading, error, organizations, fetchOrganizations, fetchEvents } =
    useEventbrite(DEFAULT_ORG_ID);

  useEffect(() => {
    if (!DEFAULT_ORG_ID) {
      fetchOrganizations();
    }
  }, [fetchOrganizations]);

  useEffect(() => {
    if (!DEFAULT_ORG_ID && !selectedOrgId && organizations.length > 0) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchEvents(selectedOrgId);
    }
  }, [selectedOrgId, fetchEvents]);

  const formattedEvents = events.map(formatEventbriteEvent);

  // Filter by active/all and search query
  const filteredEvents = formattedEvents
    .filter((event) =>
      showAllEvents
        ? true
        : (event.status === "live" || event.status === "started" || !event.isPast)
    )
    .filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const eventsToShow = filteredEvents.length > 0 ? filteredEvents : formattedEvents;

  // Fallback: If no API events, try using public organizer page URL
  const ORG_PAGE_URL = import.meta.env.VITE_EVENTBRITE_ORG_PAGE_URL as string | undefined;
  const [publicLinks, setPublicLinks] = useState<Array<{title: string; url: string}>>([]);

  useEffect(() => {
    async function fetchPublic() {
      if (!ORG_PAGE_URL || formattedEvents.length > 0) return;
      try {
        const { data, error } = await supabase.functions.invoke("eventbrite_public", { body: { url: ORG_PAGE_URL } });
        if (!error && data && typeof data === 'object' && 'events' in data) {
          setPublicLinks((data as any).events as Array<{title: string; url: string}>);
        }
      } catch {}
    }
    fetchPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ORG_PAGE_URL, formattedEvents.length]);

  const handleRegister = (eventUrl: string, eventTitle: string) => {
    window.open(eventUrl, "_blank");
    toast.success(`Opening registration!`, {
      description: `Registering for ${eventTitle}`,
    });
  };

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6 safe-area-pt">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Events
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover upcoming tastings & experiences
            </p>
          </div>


          {/* Search & Toggle */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Button variant="glass" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-past"
                checked={showAllEvents}
                onCheckedChange={setShowAllEvents}
              />
              <Label htmlFor="show-past" className="text-sm text-muted-foreground cursor-pointer">
                Show past events
              </Label>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Events List */}
          {!loading && !error && (
            <div className="space-y-4">
              {eventsToShow.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard
                    title={event.title}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    spotsLeft={event.hasAvailableTickets ? undefined : 0}
                    image={event.image || undefined}
                    onRegister={() => handleRegister(event.url, event.title)}
                  />
                </motion.div>
              ))}

              {/* Fallback to public organizer page links when API returned none */}
              {eventsToShow.length === 0 && publicLinks.length > 0 && (
                <div className="space-y-3">
                  {publicLinks.map((link, i) => (
                    <motion.div key={link.url} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-serif text-lg font-semibold truncate">{link.title || "Event"}</p>
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-gold truncate">{link.url}</a>
                      </div>
                      <Button variant="gold" size="sm" onClick={() => handleRegister(link.url, link.title || "Event")}>View on Eventbrite</Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && formattedEvents.length === 0 && publicLinks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Events;