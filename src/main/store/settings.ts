import Store from 'electron-store'

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
  isCustom: boolean
  addedAt: string
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

class SettingsStore {
  private store: Store<Settings>

  constructor() {
    this.store = new Store<Settings>({
      name: 'settings',
      defaults: defaultSettings,
      schema: {
        gamePath: { type: 'string' },
        language: { type: 'string', enum: ['English', 'French', 'German'] },
        architecture: { type: 'string', enum: ['32bit', '64bit'] },
        activeServerId: { type: 'string' },
        servers: { type: 'array' },
        discordRPC: { type: 'boolean' },
        autoUpdate: { type: 'boolean' },
        backgroundType: { type: 'string', enum: ['default', 'image', 'video'] },
        backgroundPath: { type: 'string' },
        backgroundImages: { type: 'array' },
        backgroundInterval: { type: 'number' },
        accentColor: { type: 'string' },
        closeToTray: { type: 'boolean' },
        launchAndClose: { type: 'boolean' },
        minimizeOnLaunch: { type: 'boolean' }
      }
    })
  }

  getAll(): Settings {
    return this.store.store
  }

  setAll(patch: Partial<Settings>): void {
    // Sanitize to only allow known keys
    const allowed = Object.keys(defaultSettings) as (keyof Settings)[]
    for (const key of allowed) {
      if (key in patch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.store.set(key, patch[key] as any)
      }
    }
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.store.get(key)
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.store.set(key, value)
  }
}

export const settingsStore = new SettingsStore()
