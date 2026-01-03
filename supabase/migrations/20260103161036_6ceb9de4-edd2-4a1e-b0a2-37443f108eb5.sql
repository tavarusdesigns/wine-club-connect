-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify user on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  member_user_id UUID;
  status_message TEXT;
BEGIN
  -- Get the user_id from the profile
  SELECT user_id INTO member_user_id
  FROM profiles
  WHERE id = NEW.member_id;

  -- Only create notification if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'ready' THEN status_message := 'Your wine order is ready for pickup at Cabernet Steakhouse!';
      WHEN 'picked_up' THEN status_message := 'Your wine order has been marked as picked up. Thank you!';
      ELSE status_message := 'Your wine order status has been updated.';
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (member_user_id, 'order_status', 'Order Update', status_message, NEW.id::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order status changes
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON public.wine_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();