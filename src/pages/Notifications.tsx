import AppLayout from "@/components/layout/AppLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotifications } = useNotifications();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const clear = () => setSelected({});
  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);


  const pageSize = 10;
  const [page, setPage] = useState(1);
  const total = notifications.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = notifications.slice(start, start + pageSize);

  const goto = (n: typeof notifications[number]) => {
    const target = n.type === "new_event" ? "/events" : n.type === "order_status" ? "/orders" : "/bonus";
    navigate(target);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold">Notifications</h1>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <Button variant="destructive" size="sm" onClick={() => deleteNotifications.mutate(selectedIds)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete ({selectedIds.length})
                </Button>
                <Button variant="outline" size="sm" onClick={clear}>Clear selection</Button>
              </>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-2" />
            No notifications yet
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-xl p-4 border flex items-start gap-3 ${selected[n.id] ? 'ring-2 ring-gold/50' : ''}`}
                onClick={() => goto(n)}
              >
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={!!selected[n.id]}
                    onChange={(e) => { e.stopPropagation(); toggle(n.id); }}
                    className="mr-2 align-middle"
                  />
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${n.is_read ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    {n.type}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteNotifications.mutate([n.id]); }}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Notifications older than 30 days are automatically removed.
        </p>
      </div>
    </AppLayout>
  );
}
