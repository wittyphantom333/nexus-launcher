import axios from 'axios'
import { createConnection } from 'net'

export interface ServerStatus {
  online: boolean
  playerCount?: number
  latency?: number
  message?: string
  version?: string
  lastChecked: string
}

export class ServerStatusService {
  private cache = new Map<string, { status: ServerStatus; expiresAt: number }>()
  private readonly CACHE_TTL = 30_000 // 30s

  async checkStatus(apiUrl: string): Promise<ServerStatus> {
    const cached = this.cache.get(apiUrl)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.status
    }

    const status = await this.fetchStatus(apiUrl)
    this.cache.set(apiUrl, { status, expiresAt: Date.now() + this.CACHE_TTL })
    return status
  }

  private async fetchStatus(url: string): Promise<ServerStatus> {
    const lastChecked = new Date().toISOString()

    // If URL ends in /status or similar REST path, try HTTP first
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return this.fetchHttpStatus(url, lastChecked)
    }

    // Otherwise treat as host:port for TCP ping
    const [host, portStr] = url.split(':')
    const port = parseInt(portStr ?? '24000', 10)
    return this.tcpPing(host, port, lastChecked)
  }

  private async fetchHttpStatus(url: string, lastChecked: string): Promise<ServerStatus> {
    const start = Date.now()
    try {
      const res = await axios.get<{
        online?: boolean
        playerCount?: number
        message?: string
        version?: string
      }>(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'NexusLauncher/1.0', Accept: 'application/json' }
      })
      const latency = Date.now() - start
      const data = res.data
      return {
        online: data.online ?? true,
        playerCount: data.playerCount,
        latency,
        message: data.message,
        version: data.version,
        lastChecked
      }
    } catch {
      return { online: false, latency: undefined, lastChecked }
    }
  }

  private tcpPing(host: string, port: number, lastChecked: string): Promise<ServerStatus> {
    const start = Date.now()
    return new Promise(resolve => {
      const socket = createConnection({ host, port, timeout: 5000 })
      socket.once('connect', () => {
        const latency = Date.now() - start
        socket.destroy()
        resolve({ online: true, latency, lastChecked })
      })
      socket.once('error', () => {
        resolve({ online: false, lastChecked })
      })
      socket.once('timeout', () => {
        socket.destroy()
        resolve({ online: false, lastChecked })
      })
    })
  }
}
