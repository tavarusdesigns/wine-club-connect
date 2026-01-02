-- Create wine orders table
CREATE TABLE public.wine_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wine order items table (up to 10 lines per order)
CREATE TABLE public.wine_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.wine_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL CHECK (line_number >= 1 AND line_number <= 10),
  wine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, line_number)
);

-- Enable RLS
ALTER TABLE public.wine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for wine_orders
CREATE POLICY "Admins can manage wine orders"
ON public.wine_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can view their own orders"
ON public.wine_orders
FOR SELECT
USING (member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS policies for wine_order_items
CREATE POLICY "Admins can manage wine order items"
ON public.wine_order_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can view their own order items"
ON public.wine_order_items
FOR SELECT
USING (order_id IN (
  SELECT wo.id FROM public.wine_orders wo
  JOIN public.profiles p ON wo.member_id = p.id
  WHERE p.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_wine_orders_updated_at
BEFORE UPDATE ON public.wine_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();