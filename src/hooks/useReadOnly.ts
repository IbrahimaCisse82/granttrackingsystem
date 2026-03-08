import { useAuth } from './useAuth';

/**
 * Returns true if the current user should NOT be able to edit the given project.
 * - lecteur: always read-only
 * - beneficiaire: read-only on projects they don't own
 * - admin/manager: always can edit
 */
export function useReadOnly(projectUserId?: string): boolean {
  const { user, role } = useAuth();
  if (!role || !user) return true;
  if (role === 'admin' || role === 'manager') return false;
  if (role === 'lecteur') return true;
  // beneficiaire: can only edit own projects
  if (role === 'beneficiaire') return projectUserId !== user.id;
  return true;
}
