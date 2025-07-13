import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  IpcMainInvokeEvent,
  screen,
  session
} from 'electron'
import * as path from 'path'
import { cleanupAudio, setupAudioIpcHandlers } from './audioHandler'
import { AIMode, AppConfig, configManager } from './config'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let isVisible = true

interface ScreenSize {
  width: number
  height: number
}

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height }: ScreenSize = primaryDisplay.bounds // Use bounds instead of workAreaSize for true fullscreen

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: false,
    hasShadow: false,
    fullscreen: false, // We want manual fullscreen control
    kiosk: false,
    type: 'toolbar', // Helps with click-through on some platforms
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      backgroundThrottling: false,
      webSecurity: true,
      offscreen: false, // Ensure proper rendering
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: 'GetDisplayMedia',
      disableBlinkFeatures: ''
    }
  })

  // Set content protection to prevent screenshots/recording of the app
  mainWindow.setContentProtection(true)

  // Set window to be click-through initially when not visible
  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  // // Set initial window interaction based on visibility state
  // if (isVisible) {
  //   mainWindow.setIgnoreMouseEvents(false) // Allow interaction when visible
  // } else {
  //   mainWindow.setIgnoreMouseEvents(true, { forward: true }) // Click-through when hidden
  // }

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Register global shortcuts
  registerGlobalShortcuts()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle window focus to maintain click-through
  mainWindow.on('focus', () => {
    if (!isVisible && mainWindow) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
    }
  })

  // Ensure window stays on top and maintains transparency
  mainWindow.on('show', () => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver')
    }
  })
}

function registerGlobalShortcuts(): void {
  // Toggle visibility (Ctrl+\)
  globalShortcut.register('CommandOrControl+\\', () => {
    isVisible = !isVisible
    if (mainWindow) {
      if (isVisible) {
        // When showing panels, disable click-through so user can interact
        mainWindow.setIgnoreMouseEvents(false)
      } else {
        // When hiding panels, enable click-through so clicks pass through
        mainWindow.setIgnoreMouseEvents(true, { forward: true })
      }
      mainWindow.webContents.send('toggle-visibility', isVisible)
    }
  })

  // Screenshot and analyze (Ctrl+Enter)
  globalShortcut.register('CommandOrControl+Return', () => {
    if (isVisible) {
      captureScreen()
    }
  })

  // Toggle microphone (Ctrl+M)
  globalShortcut.register('CommandOrControl+M', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('toggle-microphone')
    }
  })

  // Toggle system audio capture (Ctrl+A) - works even when window is hidden
  globalShortcut.register('CommandOrControl+A', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-system-audio')
    }
  })

  // Panel movement shortcuts
  globalShortcut.register('CommandOrControl+Up', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('move-panels', 'up')
    }
  })

  globalShortcut.register('CommandOrControl+Down', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('move-panels', 'down')
    }
  })

  globalShortcut.register('CommandOrControl+Left', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('move-panels', 'left')
    }
  })

  globalShortcut.register('CommandOrControl+Right', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('move-panels', 'right')
    }
  })

  // Toggle recording mode (Ctrl+R) - makes buttons fully clickable
  globalShortcut.register('CommandOrControl+R', () => {
    // if (mainWindow) {
    //   isRecordingMode = !isRecordingMode
    //   if (isRecordingMode) {
    //     // Ensure window is fully interactive for recording
    //     mainWindow.setAlwaysOnTop(false)
    //     mainWindow.setIgnoreMouseEvents(false)
    //     mainWindow.setFocusable(true)
    //     console.log('Recording mode ON - window is now fully interactive for ShareX')
    //     mainWindow.webContents.send('recording-mode-changed', true)
    //   } else {
    //     // Restore overlay behavior
    //     mainWindow.setAlwaysOnTop(true, 'screen-saver')
    //     mainWindow.setFocusable(false)
    //     // Restore click-through behavior based on visibility
    //     if (isVisible) {
    //       mainWindow.setIgnoreMouseEvents(false)
    //     } else {
    //       mainWindow.setIgnoreMouseEvents(true, { forward: true })
    //     }
    //     console.log('Recording mode OFF - window restored to overlay mode')
    //     mainWindow.webContents.send('recording-mode-changed', false)
    //   }
    // }
  })
}

async function captureScreen(): Promise<void> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    })

    if (sources.length > 0 && mainWindow) {
      const screenshot = sources[0].thumbnail.toDataURL()
      mainWindow.webContents.send('screenshot-captured', screenshot)
    }
  } catch (error) {
    console.error('Error capturing screen:', error)
  }
}

// IPC handlers
ipcMain.handle('set-click-through', (_event: IpcMainInvokeEvent, enabled: boolean): void => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(enabled, { forward: true })
  }
})

ipcMain.handle('get-screen-size', (): ScreenSize => {
  const { width, height } = screen.getPrimaryDisplay().bounds // Use bounds for true fullscreen
  return { width, height }
})

// Config IPC handlers
ipcMain.handle('config:get', (): AppConfig => {
  return configManager.getConfig()
})

ipcMain.handle('config:update', (_event: IpcMainInvokeEvent, updates: Partial<AppConfig>): void => {
  configManager.updateConfig(updates)
})

ipcMain.handle(
  'config:add-mode',
  (_event: IpcMainInvokeEvent, mode: Omit<AIMode, 'id'> & { id?: string }): string => {
    return configManager.addMode(mode)
  }
)

ipcMain.handle(
  'config:update-mode',
  (_event: IpcMainInvokeEvent, id: string, updates: Partial<Omit<AIMode, 'id'>>): void => {
    configManager.updateMode(id, updates)
  }
)

ipcMain.handle('config:delete-mode', (_event: IpcMainInvokeEvent, id: string): void => {
  configManager.deleteMode(id)
})

ipcMain.handle('config:select-mode', (_event: IpcMainInvokeEvent, id: string): void => {
  configManager.selectMode(id)
})

ipcMain.handle('config:get-selected-mode', (): AIMode | undefined => {
  return configManager.getSelectedMode()
})

ipcMain.handle('config:reset', (): void => {
  configManager.resetToDefaults()
})

ipcMain.handle('config:export', (): string => {
  return configManager.exportConfig()
})

ipcMain.handle('config:import', (_event: IpcMainInvokeEvent, configJson: string): boolean => {
  return configManager.importConfig(configJson)
})

ipcMain.handle('config:set-api-key', (_event: IpcMainInvokeEvent, apiKey: string): void => {
  configManager.setApiKey(apiKey)
})

ipcMain.handle('config:get-api-key', (): string => {
  return configManager.getApiKey()
})

ipcMain.handle('config:has-valid-api-key', (): boolean => {
  return configManager.hasValidApiKey()
})

ipcMain.handle('config:clear-api-key', (): void => {
  configManager.clearApiKey()
})

ipcMain.handle('config:get-config-path', (): string => {
  return configManager.getConfigPath()
})

ipcMain.handle('config:open-config-file', (): void => {
  configManager.openConfigFile()
})

ipcMain.handle('config:open-config-folder', (): void => {
  configManager.openConfigFolder()
})

app.whenReady().then(() => {
  // Setup display media request handler for system audio capture
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen'] })
        .then((sources) => {
          // On Windows/Linux, enable system audio loopback
          callback({
            video: sources[0],
            audio: process.platform === 'darwin' ? undefined : 'loopback'
          })
        })
        .catch((error) => {
          console.error('Error getting desktop sources:', error)
          callback({ video: undefined, audio: undefined })
        })
    },
    { useSystemPicker: false } // Use false to avoid system picker dialog
  )

  createWindow()

  // Setup audio capture handlers
  setupAudioIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('before-quit', async () => {
  // Cleanup audio resources
  await cleanupAudio()

  if (mainWindow) {
    mainWindow.removeAllListeners('close')
    mainWindow.close()
  }
})
