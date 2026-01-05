-- Add received_at to track pickup status; safe if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_bonus_claims'
      AND column_name = 'received_at'
  ) THEN
    ALTER TABLE public.user_bonus_claims ADD COLUMN received_at timestamp with time zone NULL;
  END IF;
END $$;

-- Allow admins to update user_bonus_claims (for setting pickup status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_bonus_claims' AND policyname = 'Admins can update claims'
  ) THEN
    CREATE POLICY "Admins can update claims"
    ON public.user_bonus_claims FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
