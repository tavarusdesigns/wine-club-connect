import { motion } from "framer-motion";
import { Package, Wine, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import OrderCard from "@/components/cards/OrderCard";
import { useWineOrders } from "@/hooks/useWineOrders";
import { format } from "date-fns";

const Orders = () => {
  const { orders, isLoading } = useWineOrders();

  const readyOrders = orders.filter((o) => o.status === "ready");
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const pastOrders = orders.filter((o) => o.status === "picked_up");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </AppLayout>
    );
  }

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
              Wine Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your wine pickups
            </p>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full wine-gradient flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {readyOrders.length + pendingOrders.length}
              </p>
              <p className="text-sm text-muted-foreground">Active Orders</p>
            </div>
          </div>

          {orders.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <Wine className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          )}

          {/* Ready for Pickup */}
          {readyOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Ready for Pickup
              </h2>
              {readyOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <OrderCard
                    orderNumber={order.id.slice(0, 8).toUpperCase()}
                    date={format(new Date(order.order_date), "MMMM d, yyyy")}
                    status="ready"
                    wines={order.items.map((item) => ({
                      name: item.wine_name,
                      quantity: item.quantity,
                    }))}
                    pickupLocation="Downtown Wine Club"
                    total={order.total}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pending */}
          {pendingOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Preparing
              </h2>
              {pendingOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <OrderCard
                    orderNumber={order.id.slice(0, 8).toUpperCase()}
                    date={format(new Date(order.order_date), "MMMM d, yyyy")}
                    status="pending"
                    wines={order.items.map((item) => ({
                      name: item.wine_name,
                      quantity: item.quantity,
                    }))}
                    pickupLocation="Downtown Wine Club"
                    total={order.total}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif text-lg font-semibold text-muted-foreground">
                Past Orders
              </h2>
              {pastOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <OrderCard
                    orderNumber={order.id.slice(0, 8).toUpperCase()}
                    date={format(new Date(order.order_date), "MMMM d, yyyy")}
                    status="picked_up"
                    wines={order.items.map((item) => ({
                      name: item.wine_name,
                      quantity: item.quantity,
                    }))}
                    pickupLocation="Downtown Wine Club"
                    total={order.total}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Orders;
