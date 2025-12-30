-- Create monthly wine bonuses table
CREATE TABLE public.monthly_wine_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  is_available boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Create wines for each bonus
CREATE TABLE public.bonus_wines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bonus_id uuid NOT NULL REFERENCES public.monthly_wine_bonuses(id) ON DELETE CASCADE,
  name text NOT NULL,
  vintage_year integer,
  region text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Track user claims
CREATE TABLE public.user_bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_id uuid NOT NULL REFERENCES public.monthly_wine_bonuses(id) ON DELETE CASCADE,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, bonus_id)
);

-- Enable RLS
ALTER TABLE public.monthly_wine_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bonus_claims ENABLE ROW LEVEL SECURITY;

-- Monthly wine bonuses: anyone authenticated can read, only admins can modify
CREATE POLICY "Authenticated users can view bonuses"
ON public.monthly_wine_bonuses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage bonuses"
ON public.monthly_wine_bonuses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bonus wines: anyone authenticated can read, only admins can modify
CREATE POLICY "Authenticated users can view bonus wines"
ON public.bonus_wines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage bonus wines"
ON public.bonus_wines FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- User bonus claims: users can view/insert their own, admins can view all
CREATE POLICY "Users can view their own claims"
ON public.user_bonus_claims FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can claim bonuses"
ON public.user_bonus_claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims"
ON public.user_bonus_claims FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_monthly_wine_bonuses_updated_at
BEFORE UPDATE ON public.monthly_wine_bonuses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add policy for admins to view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));