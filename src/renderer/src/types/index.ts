// ─── Server ────────────────────────────────────────────────────────────────
export interface ServerProfile {
  id: string
  name: string
  host: string
  port: number
  description: string
  website?: string
  logoUrl?: string
  bannerUrl?: string
  newsUrl?: string
  patchManifestUrl?: string
  statusUrl?: string
  charactersUrl?: string
  isCustom: boolean
  addedAt: string
}

export interface ServerStatus {
  online: boolean
  playerCount?: number
  latency?: number
  message?: string
  version?: string
  lastChecked: string
}

// ─── Settings ──────────────────────────────────────────────────────────────
export interface Settings {
  gamePath: string
  language: 'English' | 'French' | 'German'
  architecture: '32bit' | '64bit'
  activeServerId: string
  servers: ServerProfile[]
  discordRPC: boolean
  autoUpdate: boolean
  backgroundType: 'default' | 'image' | 'video'
  backgroundPath: string
  backgroundImages: string[]
  backgroundInterval: number
  accentColor: string
  closeToTray: boolean
  launchAndClose: boolean
  minimizeOnLaunch: boolean
}

// ─── Patcher ───────────────────────────────────────────────────────────────
export interface PatchProgress {
  phase: 'checking' | 'downloading' | 'complete' | 'error'
  currentFile: string
  filesChecked: number
  totalFiles: number
  bytesDownloaded: number
  totalBytes: number
  speed: number
  percent: number
  error?: string
}

// ─── News ──────────────────────────────────────────────────────────────────
export interface NewsItem {
  id: string
  title: string
  summary: string
  content?: string
  date: string
  imageUrl?: string
  url?: string
  author?: string
  tags?: string[]
  isPinned?: boolean
}

export interface PatchNote {
  version: string
  date: string
  content: string
  title?: string
  url?: string
}

// ─── Character ─────────────────────────────────────────────────────────────
export interface Character {
  id: string
  name: string
  class: string
  race: string
  level: number
  faction: 'Exile' | 'Dominion'
  path: string
  zone?: string
  lastLogin?: string
  avatarUrl?: string
}

// ─── Update ────────────────────────────────────────────────────────────────
export type UpdateState = 'idle' | 'available' | 'downloading' | 'ready' | 'error'
export interface UpdateInfo {
  version: string
  percent?: number
  error?: string
}

// ─── Launcher ──────────────────────────────────────────────────────────────
export interface LaunchResult {
  success: boolean
  error?: string
}

export interface ValidationResult {
  valid: boolean
  executable?: string
  error?: string
}

export type LaunchState = 'idle' | 'checking' | 'patching' | 'launching' | 'running' | 'error'

export type Page = 'home' | 'servers' | 'patch-notes' | 'settings'
