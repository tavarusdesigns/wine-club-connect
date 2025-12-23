import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import EventCard from "@/components/cards/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mockEvents = [
  {
    id: 1,
    title: "Holiday Wine Tasting Gala",
    date: "December 28, 2025",
    time: "6:00 PM",
    location: "Grand Vineyard Estate, Napa Valley",
    spotsLeft: 12,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
  },
  {
    id: 2,
    title: "New Year's Eve Celebration",
    date: "December 31, 2025",
    time: "8:00 PM",
    location: "The Wine Cellar Downtown",
    spotsLeft: 8,
    image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80",
  },
  {
    id: 3,
    title: "Winter Reds Wine Pairing Dinner",
    date: "January 15, 2026",
    time: "7:00 PM",
    location: "Chateau Elegance Restaurant",
    spotsLeft: 20,
    image: "https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=800&q=80",
  },
  {
    id: 4,
    title: "Burgundy Masterclass",
    date: "January 22, 2026",
    time: "5:30 PM",
    location: "Wine Academy Hall",
    spotsLeft: 6,
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80",
  },
  {
    id: 5,
    title: "Champagne & Sparkling Workshop",
    date: "February 5, 2026",
    time: "4:00 PM",
    location: "Bubbles & Brews Lounge",
    spotsLeft: 15,
    image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80",
  },
];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = mockEvents.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegister = (eventTitle: string) => {
    toast.success(`Registration confirmed!`, {
      description: `You're registered for ${eventTitle}`,
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

          {/* Search */}
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

          {/* Events List */}
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
                  spotsLeft={event.spotsLeft}
                  image={event.image}
                  onRegister={() => handleRegister(event.title)}
                />
              </motion.div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
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
