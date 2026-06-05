import { Client } from 'discord-rpc'

const CLIENT_ID = '1234567890123456789' // Replace with your Discord App Client ID

export class DiscordService {
  private client: Client | null = null
  private ready = false
  private startTimestamp = new Date()

  async initialize(): Promise<void> {
    try {
      this.client = new Client({ transport: 'ipc' })

      this.client.on('ready', () => {
        this.ready = true
        this.setDefaultActivity()
      })

      this.client.on('disconnected', () => {
        this.ready = false
      })

      await this.client.login({ clientId: CLIENT_ID })
    } catch {
      // Discord not running or not installed — fail silently
      this.client = null
      this.ready = false
    }
  }

  async setActivity(activity: Record<string, unknown>): Promise<boolean> {
    if (!this.client || !this.ready) return false
    try {
      await this.client.setActivity({
        startTimestamp: this.startTimestamp,
        largeImageKey: 'nexus_logo',
        largeImageText: 'NexusForever – WildStar Private Server',
        instance: false,
        ...activity
      })
      return true
    } catch {
      return false
    }
  }

  async clearActivity(): Promise<void> {
    if (!this.client || !this.ready) return
    try {
      await this.client.clearActivity()
    } catch {
      // ignore
    }
  }

  private async setDefaultActivity(): Promise<void> {
    await this.setActivity({
      details: 'In Launcher',
      state: 'Browsing servers',
      smallImageKey: 'launcher_icon',
      smallImageText: 'Nexus Launcher'
    })
  }

  destroy(): void {
    if (this.client) {
      try {
        this.client.destroy()
      } catch {
        // ignore
      }
      this.client = null
      this.ready = false
    }
  }
}
