import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  // joined from profiles
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  activeOrg: Organization | null;
  activeOrgId: string | null;
  setActiveOrg: (orgId: string) => void;
  isLoading: boolean;
  createOrg: (name: string, slug: string, description?: string) => Promise<Organization>;
  members: OrgMember[];
  membersLoading: boolean;
  addMember: (userId: string, role?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  orgRole: string | null;
  needsOnboarding: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  activeOrg: null,
  activeOrgId: null,
  setActiveOrg: () => {},
  isLoading: true,
  createOrg: async () => ({} as Organization),
  members: [],
  membersLoading: false,
  addMember: async () => {},
  removeMember: async () => {},
  updateMemberRole: async () => {},
  orgRole: null,
  needsOnboarding: false,
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Fetch organizations the user belongs to
  const orgsQuery = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user!.id);
      if (mErr) throw mErr;
      if (!memberships?.length) return [];

      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgs, error: oErr } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('created_at');
      if (oErr) throw oErr;
      return (orgs || []) as Organization[];
    },
    enabled: !!user,
  });

  const organizations = orgsQuery.data || [];
  const needsOnboarding = !orgsQuery.isLoading && organizations.length === 0 && !!user;

  // Load active org from profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('active_organization_id').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data?.active_organization_id) {
          setActiveOrgId(data.active_organization_id as string);
        }
      });
  }, [user]);

  // Fallback: if no active org but user has orgs, pick the first
  useEffect(() => {
    if (!activeOrgId && organizations.length > 0) {
      setActiveOrgId(organizations[0].id);
    }
  }, [activeOrgId, organizations]);

  const activeOrg = organizations.find(o => o.id === activeOrgId) || null;

  const setActiveOrg = useCallback(async (orgId: string) => {
    setActiveOrgId(orgId);
    if (user) {
      await supabase.from('profiles').update({ active_organization_id: orgId } as any).eq('user_id', user.id);
    }
  }, [user]);

  // Fetch members of active org
  const membersQuery = useQuery({
    queryKey: ['org-members', activeOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', activeOrgId!);
      if (error) throw error;

      // Get profile info for each member
      const userIds = (data || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      return (data || []).map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          ...m,
          role: m.role as 'owner' | 'admin' | 'member',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
        };
      }) as OrgMember[];
    },
    enabled: !!activeOrgId,
  });

  const orgRole = membersQuery.data?.find(m => m.user_id === user?.id)?.role || null;

  // Create organization
  const createMutation = useMutation({
    mutationFn: async ({ name, slug, description }: { name: string; slug: string; description?: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name, slug, description: description || '' })
        .select()
        .single();
      if (error) throw error;

      // Add creator as owner
      const { error: mErr } = await supabase
        .from('organization_members')
        .insert({ organization_id: data.id, user_id: user!.id, role: 'owner' });
      if (mErr) throw mErr;

      return data as Organization;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setActiveOrg(org.id);
      toast.success(`Organisation "${org.name}" créée`);
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .insert({ organization_id: activeOrgId!, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrgId] });
      toast.success('Membre ajouté');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrgId] });
      toast.success('Membre retiré');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrgId] });
      toast.success('Rôle mis à jour');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  return (
    <OrganizationContext.Provider value={{
      organizations,
      activeOrg,
      activeOrgId,
      setActiveOrg,
      isLoading: orgsQuery.isLoading,
      createOrg: (name, slug, description) => createMutation.mutateAsync({ name, slug, description }),
      members: membersQuery.data || [],
      membersLoading: membersQuery.isLoading,
      addMember: (userId, role = 'member') => addMemberMutation.mutateAsync({ userId, role }),
      removeMember: (memberId) => removeMemberMutation.mutateAsync(memberId),
      updateMemberRole: (memberId, role) => updateRoleMutation.mutateAsync({ memberId, role }),
      orgRole,
      needsOnboarding,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => useContext(OrganizationContext);
