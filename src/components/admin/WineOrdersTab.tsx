import { useState, useEffect, useMemo } from "react";
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
import { toast } from "sonner";
import { Plus, ShoppingCart } from "lucide-react";

interface OrderLineItem {
  wine_name: string;
  quantity: number;
  price: number;
}

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const TAX_RATE = 0.0775;

const WineOrdersTab = () => {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(
    Array(10).fill({ wine_name: "", quantity: 1, price: 0 })
  );

  // Fetch approved members
  const { data: members = [], isLoading: membersLoading } = useQuery({
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

  // Sort members alphabetically by last name, then first name
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
      if (item.wine_name && item.quantity > 0 && item.price > 0) {
        return sum + item.quantity * item.price;
      }
      return sum;
    }, 0);
  }, [lineItems]);

  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Filter out empty line items
      const validItems = lineItems
        .map((item, index) => ({ ...item, line_number: index + 1 }))
        .filter((item) => item.wine_name.trim() !== "" && item.quantity > 0);

      if (validItems.length === 0) {
        throw new Error("Please add at least one wine to the order");
      }

      // Create the order
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

      // Create the order items
      const orderItems = validItems.map((item) => ({
        order_id: order.id,
        line_number: item.line_number,
        wine_name: item.wine_name,
        quantity: item.quantity,
        price: item.price,
        line_total: item.quantity * item.price,
      }));

      const { error: itemsError } = await supabase
        .from("wine_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast.success("Wine order created successfully!");
      // Reset form
      setSelectedMemberId("");
      setOrderDate(new Date().toISOString().split("T")[0]);
      setLineItems(Array(10).fill({ wine_name: "", quantity: 1, price: 0 }));
      queryClient.invalidateQueries({ queryKey: ["wine-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateLineItem = (
    index: number,
    field: keyof OrderLineItem,
    value: string | number
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
    createOrderMutation.mutate();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gold" />
          Create Wine Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Selection and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="member">Select Member</Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
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

          {/* Wine Line Items */}
          <div className="space-y-3">
            <Label>Wine Items</Label>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground font-medium px-1">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Wine Name</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Price ($)</div>
              </div>

              {/* Line Items */}
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="col-span-6">
                    <Input
                      placeholder="Wine name"
                      value={item.wine_name}
                      onChange={(e) =>
                        updateLineItem(index, "wine_name", e.target.value)
                      }
                      className="bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="bg-background"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="bg-background"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full wine-gradient"
            disabled={createOrderMutation.isPending || !selectedMemberId}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WineOrdersTab;
