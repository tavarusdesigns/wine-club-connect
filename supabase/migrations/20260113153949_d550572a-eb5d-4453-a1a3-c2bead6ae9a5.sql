-- Add billing address fields to profiles
ALTER TABLE public.profiles
ADD COLUMN billing_address_line1 text,
ADD COLUMN billing_address_line2 text,
ADD COLUMN billing_city text,
ADD COLUMN billing_state text,
ADD COLUMN billing_zip text;