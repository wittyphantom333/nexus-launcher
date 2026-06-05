import { ipcMain } from 'electron'
import { patcherService, launcherService, serverStatusService, discordService } from './index'
import { settingsStore } from './store/settings'
import axios from 'axios'

export function registerIpcHandlers(): void {
  // ─── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle('settings:get', () => settingsStore.getAll())

  ipcMain.handle('settings:set', (_event, patch: Record<string, unknown>) => {
    settingsStore.setAll(patch)
    return settingsStore.getAll()
  })

  // ─── Servers ───────────────────────────────────────────────────────────────
  ipcMain.handle('servers:get-status', async (_event, serverUrl: string) => {
    return serverStatusService.checkStatus(serverUrl)
  })

  ipcMain.handle('servers:fetch-repository', async (_event, repoUrl: string) => {
    try {
      const res = await axios.get(repoUrl, { timeout: 8000 })
      return { success: true, data: res.data }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  // ─── Patcher ───────────────────────────────────────────────────────────────
  ipcMain.handle('patcher:start', async (_event, manifestUrl: string, gamePath: string) => {
    return patcherService.start(manifestUrl, gamePath)
  })

  ipcMain.handle('patcher:cancel', () => {
    patcherService.cancel()
  })

  ipcMain.handle('patcher:check', async (_event, manifestUrl: string, gamePath: string) => {
    return patcherService.check(manifestUrl, gamePath)
  })

  // ─── Launcher ──────────────────────────────────────────────────────────────
  ipcMain.handle(
    'launcher:launch',
    async (_event, gamePath: string, host: string, port: number, language: string, arch: string) => {
      return launcherService.launch({ gamePath, host, port, language, arch })
    }
  )

  ipcMain.handle('launcher:find-game', async () => {
    return launcherService.findGamePath()
  })

  ipcMain.handle('launcher:validate-path', async (_event, gamePath: string) => {
    return launcherService.validatePath(gamePath)
  })

  // ─── News ──────────────────────────────────────────────────────────────────
  ipcMain.handle('news:fetch', async (_event, url: string) => {
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'NexusLauncher/1.0' }
      })
      return { success: true, data: res.data }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  // ─── Discord ───────────────────────────────────────────────────────────────
  ipcMain.handle('discord:update', async (_event, activity: Record<string, unknown>) => {
    return discordService.setActivity(activity)
  })

  ipcMain.handle('discord:clear', async () => {
    return discordService.clearActivity()
  })
}
