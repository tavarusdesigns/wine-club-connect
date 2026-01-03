-- Add status column to wine_orders table
ALTER TABLE public.wine_orders 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'ready', 'picked_up'));

-- Add index for faster status queries
CREATE INDEX idx_wine_orders_status ON public.wine_orders(status);