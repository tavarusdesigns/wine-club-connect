import { Package, Clock, CheckCircle2, Wine } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WineItem {
  name: string;
  quantity: number;
}

interface OrderCardProps {
  orderNumber: string;
  date: string;
  status: "ready" | "pending" | "picked_up";
  wines: WineItem[];
  pickupLocation: string;
  total?: number;
}

const statusConfig = {
  ready: {
    label: "Ready for Pickup",
    icon: CheckCircle2,
    className: "text-green-400 bg-green-400/10",
  },
  pending: {
    label: "Preparing",
    icon: Clock,
    className: "text-gold bg-gold/10",
  },
  picked_up: {
    label: "Picked Up",
    icon: Package,
    className: "text-muted-foreground bg-muted",
  },
};

const OrderCard = ({
  orderNumber,
  date,
  status,
  wines,
  pickupLocation,
  total,
}: OrderCardProps) => {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Order #{orderNumber}</p>
          <p className="text-sm text-muted-foreground mt-1">{date}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            statusInfo.className
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusInfo.label}
        </div>
      </div>

      <div className="space-y-2">
        {wines.map((wine, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl"
          >
            <div className="w-10 h-10 rounded-lg wine-gradient flex items-center justify-center">
              <Wine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {wine.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Qty: {wine.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Order Total</span>
            <span className="text-lg font-bold text-gold">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Pickup at</p>
          <p className="text-sm font-medium text-gold">{pickupLocation}</p>
        </div>
      )}
    </motion.div>
  );
};

export default OrderCard;
