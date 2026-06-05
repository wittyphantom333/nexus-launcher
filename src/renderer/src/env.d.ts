/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron IPC bridge – must be a module (export {}) so declare global works
declare global {
  interface Window {
    electron: {
      // Settings
      getSettings: () => Promise<import('./types').Settings>
      setSettings: (patch: Partial<import('./types').Settings>) => Promise<import('./types').Settings>

      // Dialogs
      browseFolder: () => Promise<string | null>
      browseFile: (filters: { name: string; extensions: string[] }[]) => Promise<string | null>

      // Servers
      getServerStatus: (url: string) => Promise<import('./types').ServerStatus>
      fetchRepository: (repoUrl: string) => Promise<{ success: boolean; data?: unknown; error?: string }>

      // Patcher
      startPatch: (manifestUrl: string, gamePath: string) => Promise<void>
      cancelPatch: () => Promise<void>
      checkPatch: (manifestUrl: string, gamePath: string) => Promise<{ needsPatch: boolean; count: number }>
      onPatchProgress: (cb: (progress: import('./types').PatchProgress) => void) => () => void
      onPatchComplete: (cb: () => void) => () => void
      onPatchError: (cb: (err: { message: string }) => void) => () => void

      // Launcher
      launchGame: (
        gamePath: string,
        host: string,
        port: number,
        language: string,
        arch: string
      ) => Promise<import('./types').LaunchResult>
      findGame: () => Promise<string | null>
      validateGamePath: (gamePath: string) => Promise<import('./types').ValidationResult>

      // News
      fetchNews: (url: string) => Promise<{ success: boolean; data?: unknown; error?: string }>

      // Discord
      updateDiscord: (activity: Record<string, unknown>) => Promise<boolean>
      clearDiscord: () => Promise<void>

      // Auto-updater
      onUpdateAvailable: (cb: (info: { version: string }) => void) => void
      onUpdateDownloading: (cb: (percent: number) => void) => void
      onUpdateReady: (cb: () => void) => void
      installUpdate: () => void

      // Window controls
      minimize: () => void
      maximize: () => void
      close: () => void
      getBounds: () => Promise<{ x: number; y: number; width: number; height: number }>
      setBounds: (bounds: { x: number; y: number; width: number; height: number }) => void
      openExternal: (url: string) => void
    }
  }
}

export {}
