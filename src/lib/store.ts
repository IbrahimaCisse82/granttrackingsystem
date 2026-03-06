import { create } from 'zustand';

interface AppState {
  currentProjectId: string | null;
  currentTab: string;
  currentPage: 'portfolio' | 'project' | 'tutoriel' | 'admin' | 'dashboard' | 'profile';
  sidebarSearch: string;
  openProjectIds: string[];
  
  setPage: (page: AppState['currentPage']) => void;
  openProject: (id: string, tab?: string) => void;
  openProjectTab: (id: string, tab: string) => void;
  toggleSidebarProject: (id: string) => void;
  setSidebarSearch: (q: string) => void;
  closeProject: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentProjectId: null,
  currentTab: 'infos',
  currentPage: 'portfolio',
  sidebarSearch: '',
  openProjectIds: [],

  setPage: (page) => set({ currentPage: page }),
  
  openProject: (id, tab = 'infos') => set({
    currentProjectId: id,
    currentTab: tab,
    currentPage: 'project',
    openProjectIds: [...new Set([...get().openProjectIds, id])],
  }),
  
  openProjectTab: (id, tab) => set({
    currentProjectId: id,
    currentTab: tab,
    currentPage: 'project',
    openProjectIds: [...new Set([...get().openProjectIds, id])],
  }),
  
  toggleSidebarProject: (id) => {
    const { openProjectIds } = get();
    if (openProjectIds.includes(id)) {
      set({ openProjectIds: openProjectIds.filter(x => x !== id) });
    } else {
      set({ openProjectIds: [...openProjectIds, id] });
      get().openProject(id);
    }
  },
  
  setSidebarSearch: (q) => set({ sidebarSearch: q }),

  closeProject: (id) => {
    const { currentProjectId, openProjectIds } = get();
    set({
      openProjectIds: openProjectIds.filter(x => x !== id),
      currentProjectId: currentProjectId === id ? null : currentProjectId,
      currentPage: currentProjectId === id ? 'portfolio' : get().currentPage,
    });
  },
}));
