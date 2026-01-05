-- Adds referred_by column to profiles if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by text NULL;
  END IF;
END $$;
