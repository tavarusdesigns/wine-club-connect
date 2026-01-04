import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface OrderLineItem {
  wine_name: string;
  quantity: string; // natural typing
  price: string; // natural typing
}

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const TAX_RATE = 0.0775;

const AdminCreateOrder = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(Array(10).fill({ wine_name: "", quantity: "1", price: "" }));

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

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

  const updateLineItem = (index: number, field: keyof OrderLineItem, value: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const validItems = lineItems
        .map((item, idx) => ({ ...item, line_number: idx + 1 }))
        .filter((item) => item.wine_name.trim() !== "" && parseInt(item.quantity || "0", 10) > 0);

      if (!selectedMemberId) throw new Error("Please select a member");
      if (validItems.length === 0) throw new Error("Please add at least one wine to the order");

      const { data: order, error: orderError } = await supabase
        .from("wine_orders")
        .insert({
          member_id: selectedMemberId,
          order_date: orderDate,
          subtotal,
          tax_amount: taxAmount,
          total,
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

      const { error: itemsError } = await supabase.from("wine_order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast.success("Wine order created successfully!");
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6 safe-area-pt max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gold" />
              Create Wine Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrderMutation.mutate();
              }}
              className="space-y-8"
            >
              {/* Member and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Wine Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLineItems((prev) => [...prev, { wine_name: "", quantity: "1", price: "" }])}
                  >
                    Add Row
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground font-medium px-1">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Wine Name</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-3">Price ($)</div>
                  </div>

                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-sm text-muted-foreground">{index + 1}</div>
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
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
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
                          type="text"
                          inputMode="decimal"
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

              {/* Totals */}
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-start-2 flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax (7.75%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="md:col-span-3 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-gold">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
                <Button type="submit" className="wine-gradient" disabled={createOrderMutation.isPending || !selectedMemberId}>
                  <Plus className="w-4 h-4 mr-2" />
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminCreateOrder;
