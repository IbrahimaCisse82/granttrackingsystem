import { useRef, useCallback } from 'react';
import { useProjects } from './useProjects';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

/**
 * Returns a debounced save function that persists partial project updates.
 * Usage: const save = useAutoSave(project.id);  save({ title: 'new' });
 */
export function useAutoSave(projectId: string, delay = 800) {
  const { updateProject } = useProjects();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<Project>>({});

  const flush = useCallback(async () => {
    const updates = { ...pendingRef.current };
    pendingRef.current = {};
    try {
      await updateProject(projectId, updates);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [projectId, updateProject]);

  const save = useCallback((partial: Partial<Project>) => {
    pendingRef.current = { ...pendingRef.current, ...partial };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, delay);
  }, [flush, delay]);

  return save;
}
