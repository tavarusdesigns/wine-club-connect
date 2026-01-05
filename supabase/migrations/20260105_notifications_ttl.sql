-- Automatically delete notifications older than 30 days
CREATE OR REPLACE FUNCTION public.purge_old_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run purge after each insert to keep table clean
DROP TRIGGER IF EXISTS trg_purge_old_notifications ON public.notifications;
CREATE TRIGGER trg_purge_old_notifications
AFTER INSERT ON public.notifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.purge_old_notifications();
