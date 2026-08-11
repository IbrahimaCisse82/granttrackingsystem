CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ggts-report-deadline-reminders') THEN
    PERFORM cron.unschedule('ggts-report-deadline-reminders');
  END IF;
  PERFORM cron.schedule(
    'ggts-report-deadline-reminders',
    '0 7 * * *',
    $cmd$SELECT public.send_report_deadline_reminders();$cmd$
  );
END $$;