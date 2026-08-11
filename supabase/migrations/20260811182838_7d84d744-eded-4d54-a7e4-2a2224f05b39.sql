DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ggts-report-deadline-reminders') THEN
    PERFORM cron.unschedule('ggts-report-deadline-reminders');
  END IF;
END $$;