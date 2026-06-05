import { contextBridge, ipcRenderer } from 'electron'
import type { Settings, ServerProfile } from '../main/store/settings'
import type { PatchProgress } from '../main/services/PatcherService'
import type { ServerStatus } from '../main/services/ServerStatusService'
import type { LaunchResult, ValidationResult } from '../main/services/LauncherService'

// Typed IPC API exposed to the renderer via window.electron
const api = {
  // ─── Settings ──────────────────────────────────────────────────────────
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  setSettings: (patch: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke('settings:set', patch),

  // ─── Dialogs ───────────────────────────────────────────────────────────
  browseFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:browse-folder'),
  browseFile: (filters: Electron.FileFilter[]): Promise<string | null> =>
    ipcRenderer.invoke('dialog:browse-file', filters),

  // ─── Servers ───────────────────────────────────────────────────────────
  getServerStatus: (url: string): Promise<ServerStatus> =>
    ipcRenderer.invoke('servers:get-status', url),
  fetchRepository: (repoUrl: string): Promise<{ success: boolean; data?: unknown; error?: string }> =>
    ipcRenderer.invoke('servers:fetch-repository', repoUrl),

  // ─── Patcher ───────────────────────────────────────────────────────────
  startPatch: (manifestUrl: string, gamePath: string): Promise<void> =>
    ipcRenderer.invoke('patcher:start', manifestUrl, gamePath),
  cancelPatch: (): Promise<void> => ipcRenderer.invoke('patcher:cancel'),
  checkPatch: (
    manifestUrl: string,
    gamePath: string
  ): Promise<{ needsPatch: boolean; count: number }> =>
    ipcRenderer.invoke('patcher:check', manifestUrl, gamePath),

  onPatchProgress: (cb: (progress: PatchProgress) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: PatchProgress) => cb(data)
    ipcRenderer.on('patcher:progress', listener)
    return () => ipcRenderer.removeListener('patcher:progress', listener)
  },
  onPatchComplete: (cb: () => void): (() => void) => {
    const listener = () => cb()
    ipcRenderer.on('patcher:complete', listener)
    return () => ipcRenderer.removeListener('patcher:complete', listener)
  },
  onPatchError: (cb: (err: { message: string }) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, data: { message: string }) => cb(data)
    ipcRenderer.on('patcher:error', listener)
    return () => ipcRenderer.removeListener('patcher:error', listener)
  },

  // ─── Launcher ──────────────────────────────────────────────────────────
  launchGame: (
    gamePath: string,
    host: string,
    port: number,
    language: string,
    arch: string
  ): Promise<LaunchResult> => ipcRenderer.invoke('launcher:launch', gamePath, host, port, language, arch),
  findGame: (): Promise<string | null> => ipcRenderer.invoke('launcher:find-game'),
  validateGamePath: (gamePath: string): Promise<ValidationResult> =>
    ipcRenderer.invoke('launcher:validate-path', gamePath),

  // ─── News ──────────────────────────────────────────────────────────────
  fetchNews: (url: string): Promise<{ success: boolean; data?: unknown; error?: string }> =>
    ipcRenderer.invoke('news:fetch', url),

  // ─── Discord ───────────────────────────────────────────────────────────
  updateDiscord: (activity: Record<string, unknown>): Promise<boolean> =>
    ipcRenderer.invoke('discord:update', activity),
  clearDiscord: (): Promise<void> => ipcRenderer.invoke('discord:clear'),

  // ─── Auto-updater ──────────────────────────────────────────────────────
  onUpdateAvailable: (cb: (info: { version: string }) => void): void => {
    ipcRenderer.on('update:available', (_, data) => cb(data))
  },
  onUpdateDownloading: (cb: (percent: number) => void): void => {
    ipcRenderer.on('update:downloading', (_, pct) => cb(pct))
  },
  onUpdateReady: (cb: () => void): void => {
    ipcRenderer.on('update:ready', () => cb())
  },
  installUpdate: (): void => ipcRenderer.send('update:install'),

  // ─── Window ────────────────────────────────────────────────────────────
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  getBounds: (): Promise<{ x: number; y: number; width: number; height: number }> =>
    ipcRenderer.invoke('window:get-bounds'),
  setBounds: (bounds: { x: number; y: number; width: number; height: number }): void =>
    ipcRenderer.send('window:set-bounds', bounds),
  openExternal: (url: string): void => ipcRenderer.send('shell:open-external', url)
} as const

// Re-export types the renderer needs without importing from main
export type { Settings, ServerProfile }

contextBridge.exposeInMainWorld('electron', api)

export type ElectronAPI = typeof api
