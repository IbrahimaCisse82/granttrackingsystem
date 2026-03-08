import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AppNotification {
  id: string;
  type: 'amendement' | 'rapport' | 'info';
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationHook {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

function rowToNotif(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotification['type'],
    title: row.title,
    message: row.message,
    projectId: row.project_id ?? undefined,
    read: row.read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function useNotifications(): NotificationHook {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Fetch on mount
  useEffect(() => {
    if (!user) { setNotifications([]); return; }

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setNotifications(data.map(rowToNotif));
    };
    fetchNotifs();

    // Realtime subscription
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addNotification = useCallback(async (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: n.type,
      title: n.title,
      message: n.message,
      project_id: n.projectId ?? null,
    });
  }, [user]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    supabase.from('notifications').update({ read: true }).eq('id', id).then();
  }, []);

  const markAllRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then();
  }, [user]);

  const clearAll = useCallback(() => {
    if (!user) return;
    setNotifications([]);
    supabase.from('notifications').delete().eq('user_id', user.id).then();
  }, [user]);

  const unreadCount = useCallback(() => notifications.filter(n => !n.read).length, [notifications]);

  return { notifications, addNotification, markRead, markAllRead, clearAll, unreadCount };
}
