import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface AIMode {
  id: string
  name: string
  icon: string
  prompt: string
  category?: string
  isCustom?: boolean
}

export interface AppConfig {
  opacity: number
  aiModel: string
  theme: 'light' | 'dark' | 'system'
  position: { x: number; y: number }
  selectedModeId: string
  modes: AIMode[]
  apiKey: string
}

export interface ElectronAPI {
  // Window management
  setClickThrough: (enabled: boolean) => Promise<void>
  getScreenSize: () => Promise<{ width: number; height: number }>

  // Config management
  config: {
    get: () => Promise<AppConfig>
    update: (updates: Partial<AppConfig>) => Promise<void>
    addMode: (mode: Omit<AIMode, 'id'> & { id?: string }) => Promise<string>
    updateMode: (id: string, updates: Partial<Omit<AIMode, 'id'>>) => Promise<void>
    deleteMode: (id: string) => Promise<void>
    selectMode: (id: string) => Promise<void>
    getSelectedMode: () => Promise<AIMode | undefined>
    reset: () => Promise<void>
    export: () => Promise<string>
    import: (configJson: string) => Promise<boolean>
    setApiKey: (apiKey: string) => Promise<void>
    getApiKey: () => Promise<string>
    hasValidApiKey: () => Promise<boolean>
    clearApiKey: () => Promise<void>
    getConfigPath: () => Promise<string>
    openConfigFile: () => Promise<void>
    openConfigFolder: () => Promise<void>
  }

  // Event listeners
  onToggleVisibility: (callback: (event: IpcRendererEvent, visible: boolean) => void) => void
  onToggleMicrophone: (callback: (event: IpcRendererEvent) => void) => void
  onMovePanels: (callback: (event: IpcRendererEvent, direction: string) => void) => void
  onScreenshotCaptured: (callback: (event: IpcRendererEvent, imageData: string) => void) => void

  // Remove listeners
  removeAllListeners: (channel: string) => void
}

const electronAPI: ElectronAPI = {
  // Window management
  setClickThrough: (enabled: boolean) => ipcRenderer.invoke('set-click-through', enabled),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // Config management
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates: Partial<AppConfig>) => ipcRenderer.invoke('config:update', updates),
    addMode: (mode: Omit<AIMode, 'id'> & { id?: string }) =>
      ipcRenderer.invoke('config:add-mode', mode),
    updateMode: (id: string, updates: Partial<Omit<AIMode, 'id'>>) =>
      ipcRenderer.invoke('config:update-mode', id, updates),
    deleteMode: (id: string) => ipcRenderer.invoke('config:delete-mode', id),
    selectMode: (id: string) => ipcRenderer.invoke('config:select-mode', id),
    getSelectedMode: () => ipcRenderer.invoke('config:get-selected-mode'),
    reset: () => ipcRenderer.invoke('config:reset'),
    export: () => ipcRenderer.invoke('config:export'),
    import: (configJson: string) => ipcRenderer.invoke('config:import', configJson),
    setApiKey: (apiKey: string) => ipcRenderer.invoke('config:set-api-key', apiKey),
    getApiKey: () => ipcRenderer.invoke('config:get-api-key'),
    hasValidApiKey: () => ipcRenderer.invoke('config:has-valid-api-key'),
    clearApiKey: () => ipcRenderer.invoke('config:clear-api-key'),
    getConfigPath: () => ipcRenderer.invoke('config:get-config-path'),
    openConfigFile: () => ipcRenderer.invoke('config:open-config-file'),
    openConfigFolder: () => ipcRenderer.invoke('config:open-config-folder')
  },

  // Event listeners
  onToggleVisibility: (callback) => ipcRenderer.on('toggle-visibility', callback),
  onToggleMicrophone: (callback) => ipcRenderer.on('toggle-microphone', callback),
  onMovePanels: (callback) => ipcRenderer.on('move-panels', callback),
  onScreenshotCaptured: (callback) => ipcRenderer.on('screenshot-captured', callback),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
