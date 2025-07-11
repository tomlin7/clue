import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface ElectronAPI {
  // Window management
  setClickThrough: (enabled: boolean) => Promise<void>
  getScreenSize: () => Promise<{ width: number; height: number }>
  closeApp: () => Promise<void>

  // Event listeners
  onToggleVisibility: (callback: (event: IpcRendererEvent, visible: boolean) => void) => void
  onToggleMicrophone: (callback: (event: IpcRendererEvent) => void) => void
  onToggleTheme: (callback: (event: IpcRendererEvent) => void) => void
  onMovePanels: (callback: (event: IpcRendererEvent, direction: string) => void) => void
  onScreenshotCaptured: (callback: (event: IpcRendererEvent, imageData: string) => void) => void

  // Remove listeners
  removeAllListeners: (channel: string) => void
}

const electronAPI: ElectronAPI = {
  // Window management
  setClickThrough: (enabled: boolean) => ipcRenderer.invoke('set-click-through', enabled),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  closeApp: () => ipcRenderer.invoke('close-app'),

  // Event listeners
  onToggleVisibility: (callback) => ipcRenderer.on('toggle-visibility', callback),
  onToggleMicrophone: (callback) => ipcRenderer.on('toggle-microphone', callback),
  onToggleTheme: (callback) => ipcRenderer.on('toggle-theme', callback),
  onMovePanels: (callback) => ipcRenderer.on('move-panels', callback),
  onScreenshotCaptured: (callback) => ipcRenderer.on('screenshot-captured', callback),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
