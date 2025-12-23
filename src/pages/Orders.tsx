import { motion } from "framer-motion";
import { Package } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import OrderCard from "@/components/cards/OrderCard";

const mockOrders = [
  {
    id: "1",
    orderNumber: "WC-2025-1247",
    date: "December 20, 2025",
    status: "ready" as const,
    wines: [
      { name: "2021 Château Margaux Bordeaux", quantity: 2 },
      { name: "2022 Opus One Red Blend", quantity: 1 },
    ],
    pickupLocation: "Downtown Wine Club, 123 Vine Street",
  },
  {
    id: "2",
    orderNumber: "WC-2025-1246",
    date: "December 15, 2025",
    status: "pending" as const,
    wines: [
      { name: "2020 Dom Pérignon Champagne", quantity: 1 },
      { name: "2021 Screaming Eagle Cabernet", quantity: 1 },
    ],
    pickupLocation: "Downtown Wine Club, 123 Vine Street",
  },
  {
    id: "3",
    orderNumber: "WC-2025-1240",
    date: "December 1, 2025",
    status: "picked_up" as const,
    wines: [
      { name: "2022 Caymus Special Selection", quantity: 2 },
    ],
    pickupLocation: "Downtown Wine Club, 123 Vine Street",
  },
  {
    id: "4",
    orderNumber: "WC-2025-1235",
    date: "November 25, 2025",
    status: "picked_up" as const,
    wines: [
      { name: "2021 Silver Oak Alexander Valley", quantity: 1 },
      { name: "2022 Cloudy Bay Sauvignon Blanc", quantity: 2 },
    ],
    pickupLocation: "Downtown Wine Club, 123 Vine Street",
  },
];

const Orders = () => {
  const readyOrders = mockOrders.filter((o) => o.status === "ready");
  const pendingOrders = mockOrders.filter((o) => o.status === "pending");
  const pastOrders = mockOrders.filter((o) => o.status === "picked_up");

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
                  <OrderCard {...order} />
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
                  <OrderCard {...order} />
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
                  <OrderCard {...order} />
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
