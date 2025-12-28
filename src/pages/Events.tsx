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

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [showAllEvents, setShowAllEvents] = useState(false);

  const { events, loading, error, organizations, fetchOrganizations, fetchEvents } =
    useEventbrite();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    if (!selectedOrgId && organizations.length > 0) {
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
    .filter((event) => showAllEvents || !event.isPast)
    .filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
              {filteredEvents.map((event, index) => (
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
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
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