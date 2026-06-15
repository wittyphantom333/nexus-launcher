import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Settings,
  ServerProfile,
  ServerStatus,
  PatchProgress,
  NewsItem,
  PatchNote,
  LaunchState,
  UpdateState,
  UpdateInfo,
  Page
} from '../types'

interface LauncherStore {
  // ─── Initialization ──────────────────────────────────────────────────
  initialized: boolean
  setInitialized: (v: boolean) => void

  // ─── Settings ────────────────────────────────────────────────────────
  settings: Settings
  loadSettings: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>

  // ─── Navigation ──────────────────────────────────────────────────────
  page: Page
  setPage: (page: Page) => void

  // ─── Servers ─────────────────────────────────────────────────────────
  activeServer: ServerProfile | null
  serverStatuses: Record<string, ServerStatus>
  setServerStatus: (id: string, status: ServerStatus) => void
  addServer: (server: ServerProfile) => Promise<void>
  updateServer: (server: ServerProfile) => Promise<void>
  removeServer: (id: string) => Promise<void>
  setActiveServer: (id: string) => Promise<void>

  // ─── Patcher ─────────────────────────────────────────────────────────
  patchProgress: PatchProgress | null
  setPatchProgress: (progress: PatchProgress | null) => void

  // ─── Launch ──────────────────────────────────────────────────────────
  launchState: LaunchState
  launchError: string | null
  setLaunchState: (state: LaunchState, error?: string) => void

  // ─── News ────────────────────────────────────────────────────────────
  news: NewsItem[]
  setNews: (items: NewsItem[]) => void
  patchNotes: PatchNote[]
  setPatchNotes: (notes: PatchNote[]) => void

  // ─── Auto-updater ────────────────────────────────────────────────────
  updateState: UpdateState
  updateInfo: UpdateInfo | null
  setUpdateState: (state: UpdateState, info?: UpdateInfo) => void

  // ─── Sidebar ─────────────────────────────────────────────────────────
  sidebarExpanded: boolean
  toggleSidebar: () => void
}

const defaultSettings: Settings = {
  gamePath: '',
  language: 'English',
  architecture: '64bit',
  activeServerId: '',
  servers: [],
  discordRPC: true,
  autoUpdate: true,
  backgroundType: 'default',
  backgroundPath: '',
  backgroundImages: [],
  backgroundInterval: 8,
  accentColor: '#00D4FF',
  closeToTray: false,
  launchAndClose: false,
  minimizeOnLaunch: false
}

export const useStore = create<LauncherStore>()(
  subscribeWithSelector((set, get) => ({
    // ─── Initialization ────────────────────────────────────────────────
    initialized: false,
    setInitialized: v => set({ initialized: v }),

    // ─── Settings ──────────────────────────────────────────────────────
    settings: defaultSettings,
    loadSettings: async () => {
      const s = await window.electron.getSettings()
      const activeServer = s.servers.find(sv => sv.id === s.activeServerId) ?? null
      set({ settings: s, activeServer })
    },
    updateSettings: async patch => {
      const updated = await window.electron.setSettings(patch)
      const activeServer = updated.servers.find(sv => sv.id === updated.activeServerId) ?? null
      set({ settings: updated, activeServer })
    },

    // ─── Navigation ────────────────────────────────────────────────────
    page: 'home',
    setPage: page => set({ page }),

    // ─── Servers ───────────────────────────────────────────────────────
    activeServer: null,
    serverStatuses: {},
    setServerStatus: (id, status) =>
      set(s => ({ serverStatuses: { ...s.serverStatuses, [id]: status } })),
    addServer: async server => {
      const { settings } = get()
      const servers = [...settings.servers, server]
      await get().updateSettings({
        servers,
        activeServerId: settings.activeServerId || server.id
      })
    },
    updateServer: async server => {
      const { settings } = get()
      const servers = settings.servers.map(s => (s.id === server.id ? server : s))
      await get().updateSettings({ servers })
    },
    removeServer: async id => {
      const { settings } = get()
      const servers = settings.servers.filter(s => s.id !== id)
      const activeServerId =
        settings.activeServerId === id ? (servers[0]?.id ?? '') : settings.activeServerId
      await get().updateSettings({ servers, activeServerId })
    },
    setActiveServer: async id => {
      await get().updateSettings({ activeServerId: id })
    },

    // ─── Patcher ───────────────────────────────────────────────────────
    patchProgress: null,
    setPatchProgress: progress => set({ patchProgress: progress }),

    // ─── Launch ────────────────────────────────────────────────────────
    launchState: 'idle',
    launchError: null,
    setLaunchState: (state, error) => set({ launchState: state, launchError: error ?? null }),

    // ─── News ──────────────────────────────────────────────────────────
    news: [],
    setNews: items => set({ news: items }),
    patchNotes: [],
    setPatchNotes: notes => set({ patchNotes: notes }),

    // ─── Auto-updater ──────────────────────────────────────────────────
    updateState: 'idle',
    updateInfo: null,
    setUpdateState: (state, info) => set({ updateState: state, updateInfo: info ?? null }),

    // ─── Sidebar ───────────────────────────────────────────────────────
    sidebarExpanded: false,
    toggleSidebar: () => set(s => ({ sidebarExpanded: !s.sidebarExpanded }))
  }))
)
