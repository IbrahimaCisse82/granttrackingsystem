import { create } from 'zustand';

interface AppState {
  currentProjectId: string | null;
  currentTab: string;
  sidebarSearch: string;
  openProjectIds: string[];
  forceSaveCounter: number;

  openProject: (id: string, tab?: string) => void;
  openProjectTab: (id: string, tab: string) => void;
  toggleSidebarProject: (id: string) => void;
  setSidebarSearch: (q: string) => void;
  closeProject: (id: string) => void;
  triggerForceSave: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentProjectId: null,
  currentTab: 'infos',
  sidebarSearch: '',
  openProjectIds: [],
  forceSaveCounter: 0,

  openProject: (id, tab = 'infos') => set({
    currentProjectId: id,
    currentTab: tab,
    openProjectIds: [...new Set([...get().openProjectIds, id])],
  }),

  openProjectTab: (id, tab) => set({
    currentProjectId: id,
    currentTab: tab,
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
    });
  },

  triggerForceSave: () => set({ forceSaveCounter: get().forceSaveCounter + 1 }),
}));
