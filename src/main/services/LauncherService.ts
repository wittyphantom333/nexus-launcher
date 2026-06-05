import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { platform } from 'os'

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
  async launch(opts: LaunchOptions): Promise<LaunchResult> {
    const validation = await this.validatePath(opts.gamePath)
    if (!validation.valid || !validation.executable) {
      return { success: false, error: validation.error ?? 'Game executable not found' }
    }

    const args = this.buildArgs(opts)

    return new Promise(resolve => {
      try {
        const child = spawn(validation.executable!, args, {
          detached: true,
          stdio: 'ignore',
          cwd: opts.gamePath
        })
        child.unref()
        resolve({ success: true })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to launch game'
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

  private buildArgs(opts: LaunchOptions): string[] {
    const args: string[] = []

    // NexusForever uses -AuthServer flag
    args.push(`-AuthServer`, `${opts.host}:${opts.port}`)

    // Language
    const langMap: Record<string, string> = {
      English: 'en',
      French: 'fr',
      German: 'de'
    }
    args.push(`-Language`, langMap[opts.language] ?? 'en')

    return args
  }
}
