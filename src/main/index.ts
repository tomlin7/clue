import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  IpcMainInvokeEvent,
  screen
} from 'electron'
import * as path from 'path'

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
    titleBarStyle: 'hidden',
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
      offscreen: false // Ensure proper rendering
    }
  })

  // Set window to be click-through initially when not visible
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

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
        mainWindow.show()
        mainWindow.setIgnoreMouseEvents(false) // Allow interaction when visible
        mainWindow.setAlwaysOnTop(true, 'screen-saver')
      } else {
        mainWindow.setIgnoreMouseEvents(true, { forward: true }) // Click-through when hidden
        mainWindow.hide()
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

  // Toggle theme (Ctrl+T)
  globalShortcut.register('CommandOrControl+T', () => {
    if (isVisible && mainWindow) {
      mainWindow.webContents.send('toggle-theme')
    }
  })

  // Close app (Ctrl+Q)
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit()
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

ipcMain.handle('close-app', (): void => {
  app.quit()
})

ipcMain.handle('get-screen-size', (): ScreenSize => {
  const { width, height } = screen.getPrimaryDisplay().bounds // Use bounds for true fullscreen
  return { width, height }
})

app.whenReady().then(() => {
  createWindow()

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

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close')
    mainWindow.close()
  }
})
