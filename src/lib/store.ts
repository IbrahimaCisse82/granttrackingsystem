import { create } from 'zustand';
import { Project, MOCK_PROJECTS } from './mock-data';

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentTab: string;
  currentPage: 'portfolio' | 'project' | 'tutoriel' | 'admin';
  sidebarSearch: string;
  openProjectIds: string[];
  
  setPage: (page: AppState['currentPage']) => void;
  openProject: (id: string, tab?: string) => void;
  openProjectTab: (id: string, tab: string) => void;
  toggleSidebarProject: (id: string) => void;
  setSidebarSearch: (q: string) => void;
  addProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updater: (p: Project) => Project) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: MOCK_PROJECTS,
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
  
  addProject: (p) => set({ projects: [...get().projects, p] }),
  
  deleteProject: (id) => {
    set({
      projects: get().projects.filter(p => p.id !== id),
      currentProjectId: get().currentProjectId === id ? null : get().currentProjectId,
      currentPage: get().currentProjectId === id ? 'portfolio' : get().currentPage,
    });
  },
  
  updateProject: (id, updater) => set({
    projects: get().projects.map(p => p.id === id ? updater(p) : p),
  }),
}));
