import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OrderItem {
  id: string;
  wine_name: string;
  quantity: number;
  price: number;
  line_total: number;
}

export interface WineOrder {
  id: string;
  order_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export function useWineOrders() {
  const { user } = useAuth();

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["member-wine-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's profile id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile) return [];

      // Fetch orders for this member
      const { data: ordersData, error: ordersError } = await supabase
        .from("wine_orders")
        .select("*")
        .eq("member_id", profile.id)
        .order("order_date", { ascending: false });

      if (ordersError || !ordersData) return [];

      // Fetch order items for all orders
      const orderIds = ordersData.map((o) => o.id);
      const { data: itemsData } = await supabase
        .from("wine_order_items")
        .select("*")
        .in("order_id", orderIds)
        .order("line_number", { ascending: true });

      // Map items to orders
      const itemsMap = new Map<string, OrderItem[]>();
      if (itemsData) {
        itemsData.forEach((item) => {
          const existing = itemsMap.get(item.order_id) || [];
          itemsMap.set(item.order_id, [
            ...existing,
            {
              id: item.id,
              wine_name: item.wine_name,
              quantity: item.quantity,
              price: Number(item.price),
              line_total: Number(item.line_total),
            },
          ]);
        });
      }

      return ordersData.map((order) => ({
        id: order.id,
        order_date: order.order_date,
        status: order.status,
        subtotal: Number(order.subtotal),
        tax_amount: Number(order.tax_amount),
        total: Number(order.total),
        created_at: order.created_at,
        items: itemsMap.get(order.id) || [],
      })) as WineOrder[];
    },
    enabled: !!user,
  });

  return {
    orders,
    isLoading,
    error,
    refetch,
  };
}
