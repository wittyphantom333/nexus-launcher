import { spawn } from 'child_process'
import { existsSync, readdirSync, copyFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { platform } from 'os'
import { app } from 'electron'

export interface LaunchOptions {
  gamePath: string
  host: string
  port: number
  language: string
  arch: string
}

export interface LaunchResult {
  success: boolean
  error?: string
}

export interface ValidationResult {
  valid: boolean
  executable?: string
  error?: string
}

// Known WildStar registry paths for auto-detection (Windows only)
const WIN_REGISTRY_PATHS = [
  'HKLM\\SOFTWARE\\WOW6432Node\\NCsoft\\WildStar',
  'HKLM\\SOFTWARE\\NCsoft\\WildStar',
  'HKCU\\SOFTWARE\\NCsoft\\WildStar'
]

// Common manual install locations to check
const COMMON_PATHS_WIN = [
  'C:\\Program Files (x86)\\NCSOFT\\WildStar',
  'C:\\Program Files\\NCSOFT\\WildStar',
  'D:\\Games\\WildStar',
  'E:\\Games\\WildStar'
]

export class LauncherService {
  private getConnectorDir(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'connector')
      : join(app.getAppPath(), 'src', 'connector')
  }

  async launch(opts: LaunchOptions): Promise<LaunchResult> {
    const validation = await this.validatePath(opts.gamePath)
    if (!validation.valid) {
      return { success: false, error: validation.error ?? 'Game path not valid' }
    }

    // Copy connector files into the Client64 subfolder of the game directory
    const connectorSrc = this.getConnectorDir()
    if (!existsSync(connectorSrc)) {
      return { success: false, error: 'Connector resources not found in app' }
    }
    const client64Dir = join(opts.gamePath, 'Client64')
    try {
      mkdirSync(client64Dir, { recursive: true })
      for (const file of readdirSync(connectorSrc)) {
        copyFileSync(join(connectorSrc, file), join(client64Dir, file))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to copy connector files'
      return { success: false, error: message }
    }

    const connectorExe = join(client64Dir, 'NexusForever.ClientConnector.exe')

    return new Promise(resolve => {
      try {
        const child = spawn(connectorExe, [], {
          detached: true,
          stdio: 'ignore',
          cwd: client64Dir
        })
        child.unref()
        resolve({ success: true })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to launch'
        resolve({ success: false, error: message })
      }
    })
  }

  async validatePath(gamePath: string): Promise<ValidationResult> {
    if (!gamePath || !existsSync(gamePath)) {
      return { valid: false, error: 'Game path does not exist' }
    }

    const isWin = platform() === 'win32'
    const candidates = isWin
      ? ['Client64.exe', 'Client.exe', 'WildStar64.exe', 'WildStar.exe']
      : ['WildStar', 'Client64', 'Client']

    for (const candidate of candidates) {
      const fullPath = join(gamePath, candidate)
      if (existsSync(fullPath)) {
        return { valid: true, executable: fullPath }
      }
    }

    return { valid: false, error: 'WildStar executable not found in this folder' }
  }

  async findGamePath(): Promise<string | null> {
    if (platform() !== 'win32') return null

    // Try registry (Windows only)
    try {
      const { execSync } = await import('child_process')
      for (const regPath of WIN_REGISTRY_PATHS) {
        try {
          const result = execSync(`reg query "${regPath}" /v "Path" 2>nul`, {
            encoding: 'utf8',
            timeout: 3000
          })
          const match = result.match(/Path\s+REG_SZ\s+(.+)/i)
          if (match && match[1]) {
            const p = match[1].trim()
            const validation = await this.validatePath(p)
            if (validation.valid) return p
          }
        } catch {
          // Registry key not found, continue
        }
      }
    } catch {
      // execSync not available or failed
    }

    // Try common paths
    for (const p of COMMON_PATHS_WIN) {
      if (existsSync(p)) {
        const validation = await this.validatePath(p)
        if (validation.valid) return p
      }
    }

    return null
  }
}
