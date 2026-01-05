import { motion } from "framer-motion";
import { Search, Filter, Loader2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ORG_PAGE_URL = import.meta.env.VITE_EVENTBRITE_ORG_PAGE_URL as string | undefined;
  const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  const fetchOrganizerPage = async () => {
    if (!ORG_PAGE_URL) {
      setError("Organizer page URL is not configured.");
      setLinks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Primary: supabase-js invoke
      const { data, error } = await supabase.functions.invoke("eventbrite_public", {
        body: { url: ORG_PAGE_URL },
      });
      let payload: any = null;
      if (!error && data) {
        payload = data;
      } else {
        // Fallback: direct fetch to Edge Function endpoint
        if (!SUPA_URL || !SUPA_KEY) throw new Error("Supabase URL or key missing");
        const res = await fetch(`${SUPA_URL}/functions/v1/eventbrite_public`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPA_KEY,
          },
          body: JSON.stringify({ url: ORG_PAGE_URL }),
        });
        if (!res.ok) throw new Error(`Edge function HTTP ${res.status}`);
        payload = await res.json();
      }

      if (payload && typeof payload === "object" && "events" in payload) {
        const arr = (payload as any).events as Array<{ title: string; url: string }>;
        setLinks(arr || []);
      } else {
        setLinks([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load events";
      setError(msg);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ORG_PAGE_URL]);

  const handleOpen = (url: string, title: string) => {
    window.open(url, "_blank");
    toast.success("Opening Eventbrite", { description: title });
  };

  const filtered = links.filter((l) =>
    (l.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6 safe-area-pt">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Discover upcoming tastings & experiences</p>
          </div>

          {/* Search */}
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
              <Button variant="glass" size="icon" onClick={fetchOrganizerPage} title="Refresh">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-8 space-y-3">
              <p className="text-destructive">{error}</p>
              <Button variant="gold" size="sm" onClick={fetchOrganizerPage}>Retry</Button>
            </div>
          )}

          {/* Organizer links */}
          {!loading && !error && (
            <div className="space-y-3">
              {filtered.map((link, i) => (
                <motion.div
                  key={link.url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-semibold truncate">{link.title || "Event"}</p>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-gold truncate flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {link.url}
                    </a>
                  </div>
                  <Button variant="gold" size="sm" onClick={() => handleOpen(link.url, link.title || "Event")}>
                    View on Eventbrite
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">No events found from the organizer page.</p>
              {ORG_PAGE_URL && (
                <a href={ORG_PAGE_URL} target="_blank" rel="noreferrer" className="inline-block">
                  <Button variant="gold" size="sm">Open Organizer Page</Button>
                </a>
              )}
              <p className="text-xs text-muted-foreground">Ensure the Supabase function 'eventbrite_public' is deployed.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Events;
