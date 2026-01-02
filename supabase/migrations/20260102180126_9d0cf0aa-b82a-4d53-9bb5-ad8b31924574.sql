-- Add image_url and member_price columns to bonus_wines
ALTER TABLE public.bonus_wines 
ADD COLUMN image_url text,
ADD COLUMN member_price decimal(10,2);