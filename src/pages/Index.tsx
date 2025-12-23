import { motion } from "framer-motion";
import { Wine, Calendar, Package, Gift, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

const Index = () => {
  const memberName = "Alexandra";
  const memberSince = "2023";
  const upcomingEvents = 3;
  const pendingOrders = 2;
  const bonusAvailable = true;

  const quickStats = [
    { icon: Calendar, label: "Events", value: upcomingEvents, path: "/events", color: "text-gold" },
    { icon: Package, label: "Orders", value: pendingOrders, path: "/orders", color: "text-wine-light" },
    { icon: Gift, label: "Bonus", value: bonusAvailable ? "1" : "0", path: "/bonus", color: "text-green-400" },
  ];

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

        {/* Monthly Bonus Highlight */}
        {bonusAvailable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/bonus" className="block">
              <div className="relative overflow-hidden rounded-2xl wine-gradient p-5">
                <div className="absolute top-2 right-2 opacity-20">
                  <Sparkles className="w-20 h-20 text-gold" />
                </div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
                      <Gift className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">December Bonus</p>
                      <p className="font-serif text-lg font-semibold text-primary-foreground">
                        Ready to Claim
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
          <Link to="/events" className="block">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-wine to-wine-deep relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wine className="w-16 h-16 text-primary-foreground/20" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-16" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Holiday Wine Tasting Gala
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  December 28, 2025 • 6:00 PM
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-wine-light font-medium">
                    12 spots left
                  </span>
                  <Button variant="gold" size="sm">
                    Register Now
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Index;
