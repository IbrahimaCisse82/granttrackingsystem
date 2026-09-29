import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

/**
 * Returns true if the current user should NOT be able to edit the given project.
 * The user must be a member of the active organization (mirrors DB RLS),
 * then the global role applies:
 * - lecteur: always read-only
 * - beneficiaire: read-only on projects they don't own
 * - admin/manager: can edit
 */
export function useReadOnly(projectUserId?: string): boolean {
  const { user, role } = useAuth();
  const { orgRole, membersLoading } = useOrganization();
  if (!role || !user) return true;
  if (membersLoading || !orgRole) return true;
  if (role === 'admin' || role === 'manager') return false;
  if (role === 'lecteur') return true;
  if (role === 'beneficiaire') return projectUserId !== user.id;
  return true;
}
