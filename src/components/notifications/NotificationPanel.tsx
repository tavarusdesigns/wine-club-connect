import { motion } from "framer-motion";
import { Bell, Calendar, Package, Gift, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationPanelProps {
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order_status":
      return Package;
    case "new_event":
      return Calendar;
    case "bonus_reminder":
      return Gift;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "order_status":
      return "text-wine-light bg-wine-light/10";
    case "new_event":
      return "text-gold bg-gold/10";
    case "bonus_reminder":
      return "text-green-400 bg-green-400/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const getNotificationLabel = (type: string) => {
  switch (type) {
    case "order_status":
      return "Wine Order";
    case "new_event":
      return "New Event";
    case "bonus_reminder":
      return "Wines of the Month";
    default:
      return "Notification";
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) => {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);
  const label = getNotificationLabel(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors",
        !notification.is_read && "bg-secondary/30"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colorClass)}>
                {label}
              </span>
              <p className={cn("text-sm font-medium mt-1", !notification.is_read && "text-foreground")}>
                {notification.title}
              </p>
            </div>
            {!notification.is_read && (
              <button
                onClick={onMarkAsRead}
                className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
              >
                <Check className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 glass-card rounded-xl overflow-hidden shadow-xl"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gold" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-wine text-primary-foreground text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              className="text-xs h-7"
            >
              Mark all read
            </Button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <ScrollArea className="max-h-80">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead.mutate(notification.id)}
            />
          ))
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default NotificationPanel;
