import { useRef, useCallback, useEffect } from 'react';
import { useProjects } from './useProjects';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

/**
 * Returns a debounced save function that persists partial project updates.
 * Flushes pending changes on unmount to prevent data loss.
 */
export function useAutoSave(projectId: string, delay = 800) {
  const { updateProject } = useProjects();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<Project>>({});
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const updates = { ...pendingRef.current };
    if (Object.keys(updates).length === 0) return;
    pendingRef.current = {};
    try {
      await updateProject(projectIdRef.current, updates);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [updateProject]);

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      if (Object.keys(pendingRef.current).length > 0) {
        flush();
      }
    };
  }, [flush]);

  const save = useCallback((partial: Partial<Project>) => {
    pendingRef.current = { ...pendingRef.current, ...partial };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delay);
  }, [flush, delay]);

  return save;
}
