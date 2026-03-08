import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'amendement' | 'rapport' | 'info';
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (n) => set(state => ({
    notifications: [{
      ...n,
      id: crypto.randomUUID(),
      read: false,
      createdAt: Date.now(),
    }, ...state.notifications].slice(0, 50), // Keep last 50
  })),

  markRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
  })),

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
