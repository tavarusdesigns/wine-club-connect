import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, ShoppingCart, Pencil, Trash2, Package, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderLineItem {
  wine_name: string;
  quantity: string; // keep as string for natural typing
  price: string; // keep as string for natural typing
}

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface OrderItem {
  id: string;
  wine_name: string;
  quantity: number;
  price: number;
  line_total: number;
  line_number: number;
}

interface WineOrder {
  id: string;
  member_id: string;
  order_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  member?: Member;
  items: OrderItem[];
}

const TAX_RATE = 0.0775;

const statusConfig = {
  pending: { label: "Preparing", icon: Clock, className: "text-gold bg-gold/10" },
  ready: { label: "Ready for Pickup", icon: CheckCircle2, className: "text-green-400 bg-green-400/10" },
  picked_up: { label: "Picked Up", icon: Package, className: "text-muted-foreground bg-muted" },
};

const WineOrdersTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Create dialog removed in favor of dedicated page
  const [editingOrder, setEditingOrder] = useState<WineOrder | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(
    Array(10).fill({ wine_name: "", quantity: "1", price: "" })
  );

  // Fetch approved members
  const { data: members = [] } = useQuery({
    queryKey: ["approved-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("is_approved", true)
        .order("last_name", { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
  });

  // Fetch all orders with member info and items
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-wine-orders"],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from("wine_orders")
        .select("*")
        .order("order_date", { ascending: false });

      if (ordersError) throw ordersError;

      // Get member profiles
      const memberIds = [...new Set(ordersData.map((o) => o.member_id))];
      const { data: membersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", memberIds);

      const membersMap = new Map<string, Member>();
      membersData?.forEach((m) => membersMap.set(m.id, m));

      // Get order items
      const orderIds = ordersData.map((o) => o.id);
      const { data: itemsData } = await supabase
        .from("wine_order_items")
        .select("*")
        .in("order_id", orderIds)
        .order("line_number", { ascending: true });

      const itemsMap = new Map<string, OrderItem[]>();
      itemsData?.forEach((item) => {
        const existing = itemsMap.get(item.order_id) || [];
        itemsMap.set(item.order_id, [...existing, item as OrderItem]);
      });

      return ordersData.map((order) => ({
        ...order,
        member: membersMap.get(order.member_id),
        items: itemsMap.get(order.id) || [],
      })) as WineOrder[];
    },
  });

  // Sort members alphabetically
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const lastNameA = (a.last_name || "").toLowerCase();
      const lastNameB = (b.last_name || "").toLowerCase();
      if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
      const firstNameA = (a.first_name || "").toLowerCase();
      const firstNameB = (b.first_name || "").toLowerCase();
      return firstNameA.localeCompare(firstNameB);
    });
  }, [members]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const q = parseInt(item.quantity || "0", 10);
      const p = parseFloat(item.price || "0");
      if (item.wine_name && q > 0 && p > 0) {
        return sum + q * p;
      }
      return sum;
    }, 0);
  }, [lineItems]);

  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const validItems = lineItems
        .map((item, index) => ({ ...item, line_number: index + 1 }))
        .filter((item) => item.wine_name.trim() !== "" && item.quantity > 0);

      if (validItems.length === 0) {
        throw new Error("Please add at least one wine to the order");
      }

      const { data: order, error: orderError } = await supabase
        .from("wine_orders")
        .insert({
          member_id: selectedMemberId,
          order_date: orderDate,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = validItems.map((item) => {
        const quantity = parseInt(item.quantity || "0", 10) || 0;
        const price = parseFloat(item.price || "0") || 0;
        return {
          order_id: order.id,
          line_number: item.line_number,
          wine_name: item.wine_name,
          quantity,
          price,
          line_total: quantity * price,
        };
      });

      const { error: itemsError } = await supabase
        .from("wine_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast.success("Wine order created successfully!");
      resetForm();
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-wine-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!editingOrder) return;

      const validItems = lineItems
        .map((item, index) => ({ ...item, line_number: index + 1 }))
        .filter((item) => item.wine_name.trim() !== "" && item.quantity > 0);

      if (validItems.length === 0) {
        throw new Error("Please add at least one wine to the order");
      }

      // Update order
      const { error: orderError } = await supabase
        .from("wine_orders")
        .update({
          member_id: selectedMemberId,
          order_date: orderDate,
          subtotal: subtotal,
          tax_amount: taxAmount,
          total: total,
        })
        .eq("id", editingOrder.id);

      if (orderError) throw orderError;

      // Delete existing items and re-insert
      await supabase
        .from("wine_order_items")
        .delete()
        .eq("order_id", editingOrder.id);

      const orderItems = validItems.map((item) => {
        const quantity = parseInt(item.quantity || "0", 10) || 0;
        const price = parseFloat(item.price || "0") || 0;
        return {
          order_id: editingOrder.id,
          line_number: item.line_number,
          wine_name: item.wine_name,
          quantity,
          price,
          line_total: quantity * price,
        };
      });

      const { error: itemsError } = await supabase
        .from("wine_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      toast.success("Order updated successfully!");
      resetForm();
      setEditingOrder(null);
      queryClient.invalidateQueries({ queryKey: ["admin-wine-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Delete items first
      await supabase.from("wine_order_items").delete().eq("order_id", orderId);
      // Delete order
      const { error } = await supabase.from("wine_orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-wine-orders"] });
    },
    onError: () => {
      toast.error("Failed to delete order");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("wine_orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-wine-orders"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const resetForm = () => {
    setSelectedMemberId("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setLineItems(Array(10).fill({ wine_name: "", quantity: "1", price: "" }));
  };

  const openEditDialog = (order: WineOrder) => {
    setEditingOrder(order);
    setSelectedMemberId(order.member_id);
    setOrderDate(order.order_date);
    
    // Fill line items from order
    const items: OrderLineItem[] = Array(10).fill({ wine_name: "", quantity: "1", price: "" });
    order.items.forEach((item, index) => {
      if (index < 10) {
        items[index] = {
          wine_name: item.wine_name,
          quantity: String(item.quantity),
          price: String(Number(item.price)),
        };
      }
    });
    setLineItems(items);
  };

  const updateLineItem = (
    index: number,
    field: keyof OrderLineItem,
    value: string
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error("Please select a member");
      return;
    }
    if (editingOrder) {
      updateOrderMutation.mutate();
    } else {
      createOrderMutation.mutate();
    }
  };

  const OrderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="member">Select Member</Label>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a member..." />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              {sortedMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.last_name}, {member.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderDate">Date of Order</Label>
          <Input
            id="orderDate"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Wine Items</Label>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground font-medium px-1">
            <div className="col-span-1">#</div>
            <div className="col-span-6">Wine Name</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Price ($)</div>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-sm text-muted-foreground">
                {index + 1}
              </div>
              <div className="col-span-6">
                <Input
                  placeholder="Wine name"
                  value={item.wine_name}
                  onChange={(e) => updateLineItem(index, "wine_name", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val)) {
                      updateLineItem(index, "quantity", val);
                    }
                  }}
                  className="bg-background"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*(\.\d{0,2})?$/.test(val)) {
                      updateLineItem(index, "price", val);
                    }
                  }}
                  placeholder="0.00"
                  className="bg-background"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tax (7.75%):</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span className="text-gold">${total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full wine-gradient"
        disabled={createOrderMutation.isPending || updateOrderMutation.isPending || !selectedMemberId}
      >
        <Plus className="w-4 h-4 mr-2" />
        {editingOrder
          ? updateOrderMutation.isPending
            ? "Updating..."
            : "Update Order"
          : createOrderMutation.isPending
          ? "Creating..."
          : "Create Order"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Create Order Link Button */}
      <Button className="wine-gradient" onClick={() => navigate("/admin/orders/new") }>
        <Plus className="w-4 h-4 mr-2" />
        Create New Order
      </Button>

      {/* Edit Order Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => { if (!open) { setEditingOrder(null); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-gold" />
              Edit Wine Order
            </DialogTitle>
          </DialogHeader>
          <OrderForm />
        </DialogContent>
      </Dialog>

      {/* Orders List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gold" />
            All Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p className="text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div key={order.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium">
                          {order.member?.last_name}, {order.member?.first_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8).toUpperCase()} • {format(new Date(order.order_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", status.className)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, status: value })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="pending">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-muted-foreground">
                          <span>{item.wine_name} x{item.quantity}</span>
                          <span>${Number(item.line_total).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-gold">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(order)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the order.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrderMutation.mutate(order.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WineOrdersTab;
