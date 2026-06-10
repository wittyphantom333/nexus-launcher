import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc'
import { DiscordService } from './services/DiscordService'
import { PatcherService } from './services/PatcherService'
import { LauncherService } from './services/LauncherService'
import { ServerStatusService } from './services/ServerStatusService'

let mainWindow: BrowserWindow | null = null

export const discordService = new DiscordService()
export const patcherService = new PatcherService()
export const launcherService = new LauncherService()
export const serverStatusService = new ServerStatusService()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 667,
    frame: false,
    transparent: true,
    hasShadow: false,
    titleBarStyle: 'hidden',
    show: false,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // Show window once ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // Open DevTools for debugging (remove once issue is resolved)
    // mainWindow?.webContents.openDevTools({ mode: 'detach' })
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Wire patcher events to renderer
  patcherService.on('progress', data => {
    mainWindow?.webContents.send('patcher:progress', data)
  })
  patcherService.on('complete', () => {
    mainWindow?.webContents.send('patcher:complete')
  })
  patcherService.on('error', (err: string) => {
    mainWindow?.webContents.send('patcher:error', { message: err })
  })
}

function setupAutoUpdater(): void {
  autoUpdater.logger = null
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', info => {
    mainWindow?.webContents.send('update:available', info)
  })
  autoUpdater.on('download-progress', progress => {
    mainWindow?.webContents.send('update:downloading', progress.percent)
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:ready')
  })
  autoUpdater.on('error', err => {
    console.error('AutoUpdater error:', err)
  })

  // Check for updates 5s after startup (non-dev only)
  if (!is.dev) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000)
  }
}

// IPC: install update
ipcMain.on('update:install', () => {
  autoUpdater.quitAndInstall()
})

// IPC: window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:get-bounds', () => mainWindow?.getBounds())
ipcMain.on('window:set-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
  if (!mainWindow) return
  const { x, y, width, height } = bounds
  mainWindow.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) })
})

// IPC: open external
ipcMain.on('shell:open-external', (_event, url: string) => {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    shell.openExternal(url)
  }
})

// IPC: browse for folder/file
ipcMain.handle('dialog:browse-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select WildStar Installation Folder'
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:browse-file', async (_event, filters: Electron.FileFilter[]) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters
  })
  return result.canceled ? null : result.filePaths[0]
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.wittyphantom333.nexus-launcher')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()
  setupAutoUpdater()
  discordService.initialize()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  discordService.destroy()
  if (process.platform !== 'darwin') app.quit()
})
