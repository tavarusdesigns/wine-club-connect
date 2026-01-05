import { Home, Calendar, Package, Gift, Bell } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Upcoming Tastings & Events", path: "/events" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: Gift, label: "Wines of Month", path: "/bonus" },
  { icon: Bell, label: "Notifications", path: "/notifications", showBadge: true },
] as const;

const BottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-4 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 wine-gradient rounded-xl opacity-20"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                className={cn(
                  "w-6 h-6 transition-colors duration-300",
                  isActive ? "text-gold" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isActive ? "text-gold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {"showBadge" in item && item.showBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-gold text-[10px] text-black font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
