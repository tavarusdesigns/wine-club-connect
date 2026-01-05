import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

const showBrowserNotification = (notification: Notification) => {
  if (Notification.permission !== "granted") return;

  const getIcon = (type: string) => {
    switch (type) {
      case "order_status":
        return "📦";
      case "new_event":
        return "📅";
      case "bonus_reminder":
        return "🎁";
      default:
        return "🔔";
    }
  };

  const getTag = (type: string) => {
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

  new window.Notification(`${getIcon(notification.type)} ${getTag(notification.type)}`, {
    body: `${notification.title}\n${notification.message}`,
    icon: "/favicon.ico",
    tag: notification.id,
    requireInteraction: false,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Request notification permission on mount
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Update the cache with the new notification
          queryClient.setQueryData(
            ["notifications", user.id],
            (old: Notification[] = []) => [newNotification, ...old]
          );

          // Show browser notification
          showBrowserNotification(newNotification);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          queryClient.setQueryData(
            ["notifications", user.id],
            (old: Notification[] = []) =>
              old.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotifications = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      const prev = queryClient.getQueryData<Notification[]>(["notifications", user?.id]);
      if (prev) {
        const next = prev.filter(n => !ids.includes(n.id));
        queryClient.setQueryData(["notifications", user?.id], next);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["notifications", user?.id], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const requestPermission = useCallback(async () => {
    return await requestNotificationPermission();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    requestPermission,
    permissionGranted: typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted",
  };
};
