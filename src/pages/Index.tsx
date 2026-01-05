import { motion } from "framer-motion";
import { Wine, Calendar, Package, Gift, ChevronRight, Sparkles, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useEventbrite, formatEventbriteEvent } from "@/hooks/useEventbrite";
const DEFAULT_ORG_ID = import.meta.env.VITE_EVENTBRITE_ORG_ID as string | undefined;
import { useWineOrders } from "@/hooks/useWineOrders";
import { useWineBonuses } from "@/hooks/useWineBonuses";
import { useNotifications } from "@/hooks/useNotifications";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  membership_tier: string | null;
  created_at: string;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { events } = useEventbrite(DEFAULT_ORG_ID);
  const { orders } = useWineOrders();
  const { bonuses } = useWineBonuses();
  const { notifications } = useNotifications();

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("first_name, last_name, membership_tier, created_at")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setProfile(data);
        });
    }
  }, [user]);

  const memberName = profile?.first_name || user?.email?.split("@")[0] || "Member";
  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).getFullYear().toString()
    : new Date().getFullYear().toString();
  
  // Calculate real counts and next live event
  const now = new Date();
  const nextLiveEventRaw = (events || [])
    .filter(e => e.status === "live" && new Date(e.start?.local || "") >= now)
    .sort((a, b) => new Date(a.start.local).getTime() - new Date(b.start.local).getTime())[0];
  const nextLiveEvent = nextLiveEventRaw ? formatEventbriteEvent(nextLiveEventRaw) : null;

  const upcomingEvents = (events || [])
    .filter(e => new Date(e.start?.local || "") >= now && e.status !== "canceled").length || 0;
  const pendingOrders = orders?.filter(o => o.status === "pending" || o.status === "ready").length || 0;
  const unclaimedBonuses = bonuses?.filter(b => b.is_available && !b.isClaimed).length || 0;

  const quickStats = [
    { icon: Calendar, label: "Events", value: upcomingEvents, path: "/events", color: "text-gold" },
    { icon: Package, label: "Orders", value: pendingOrders, path: "/orders", color: "text-wine-light" },
    { icon: Gift, label: "Wines of the Month", value: unclaimedBonuses, path: "/bonus", color: "text-green-400" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <AppLayout>
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 wine-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/10" />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <Sparkles className="w-full h-full text-gold" />
        </div>
        
        <div className="relative px-5 pt-12 pb-8 safe-area-pt">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-lg">
                <Wine className="w-7 h-7 text-accent-foreground" />
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-serif font-bold text-primary-foreground">
                  {memberName}
                </h1>
                <p className="text-primary-foreground/60 text-xs mt-0.5">
                  Member since {memberSince}
                </p>
              </div>
            </motion.div>
            <div className="flex items-center gap-2 mt-2">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              >
                <LogOut className="w-5 h-5 text-primary-foreground/70" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-4 space-y-6 pb-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {quickStats.map((stat, index) => (
            <Link
              key={stat.label}
              to={stat.path}
              className="glass-card rounded-xl p-4 text-center hover:bg-card/90 transition-all duration-300"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
              >
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Notification Alert / Monthly Bonus Highlight */}
        {(unclaimedBonuses > 0 || (notifications && notifications.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to={notifications && notifications[0]?.type === "new_event"
                ? "/events"
                : notifications && notifications[0]?.type === "order_status"
                ? "/orders"
                : "/bonus"}
              className="block"
            >
              <div className="relative overflow-hidden rounded-2xl wine-gradient p-5">
                <div className="absolute top-2 right-2 opacity-20">
                  <Sparkles className="w-20 h-20 text-gold" />
                </div>
                <div className="relative flex items-center justify-between">
                  <Link to="/notifications" className="absolute top-0 right-0 text-primary-foreground/80 hover:text-primary-foreground">
                    <NotificationBell />
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
                      <Gift className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">
                        {notifications && notifications[0]
                          ? `Alert: ${notifications[0].title}`
                          : "Wines of the Month"}
                      </p>
                      <p className="font-serif text-lg font-semibold text-primary-foreground line-clamp-2">
                        {notifications && notifications[0]
                          ? notifications[0].message
                          : "Ready to pick up at Cabernet Steakhouse"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary-foreground/60" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/events">
              <Button variant="glass" className="w-full h-auto py-4 flex-col gap-2">
                <Calendar className="w-6 h-6 text-gold" />
                <span>Browse Events</span>
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="glass" className="w-full h-auto py-4 flex-col gap-2">
                <Package className="w-6 h-6 text-wine-light" />
                <span>View Orders</span>
              </Button>
            </Link>
          </div>
          
          {/* Admin Dashboard Link */}
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10">
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Featured Event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Next Event
            </h2>
            <Link
              to="/events"
              className="text-sm text-gold hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {nextLiveEvent ? (
            <Link to="/events" className="block">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-wine to-wine-deep relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wine className="w-16 h-16 text-primary-foreground/20" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-16" />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2">
                    {nextLiveEvent.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nextLiveEvent.date} • {nextLiveEvent.time}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-wine-light font-medium">
                      {nextLiveEvent.hasAvailableTickets ? "Spots available" : "Sold out"}
                    </span>
                    <Button variant="gold" size="sm">
                      Register Now
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground">
              No upcoming live events. Check back soon!
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Index;
