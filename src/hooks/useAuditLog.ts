import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AuditAction = 'create' | 'update' | 'delete' | 'archive' | 'unarchive' | 'submit_report' | 'submit_amendement' | 'approve_amendement';

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(async (action: AuditAction, projectId?: string, details?: Record<string, any>) => {
    if (!user) return;
    try {
      await supabase.from('audit_logs' as any).insert({
        user_id: user.id,
        project_id: projectId || null,
        action,
        details: details || {},
      });
    } catch (e) {
      console.error('Audit log error:', e);
    }
  }, [user]);

  return { log };
}
