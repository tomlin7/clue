import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export interface AIMode {
  id: string
  name: string
  icon: string
  prompt: string
  category?: string
  isCustom?: boolean
}

export interface InterviewModeConfig {
  screenshotInterval: number
  screenshotQuality: 'low' | 'medium' | 'high'
  autoAnalyze: boolean
  customPrompt: string
  language: string
}

export interface AppConfig {
  aiModel: string
  apiKey: string
  theme: 'light' | 'dark' | 'system'
  opacity: number
  selectedModeId: string
  modes: AIMode[]
  position: { x: number; y: number }
  interviewMode: InterviewModeConfig
}

interface ConfigContextType {
  config: AppConfig
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>
  updateOpacity: (opacity: number) => Promise<void>
  addMode: (mode: Omit<AIMode, 'id'> & { id?: string }) => Promise<string>
  updateMode: (id: string, updates: Partial<Omit<AIMode, 'id'>>) => Promise<void>
  deleteMode: (id: string) => Promise<void>
  selectMode: (id: string) => Promise<void>
  getSelectedMode: () => AIMode | undefined
  resetConfig: () => Promise<void>
  exportConfig: () => Promise<string>
  importConfig: (configJson: string) => Promise<boolean>
  setApiKey: (apiKey: string) => Promise<void>
  getApiKey: () => Promise<string>
  hasValidApiKey: () => Promise<boolean>
  clearApiKey: () => Promise<void>
  getConfigPath: () => Promise<string>
  openConfigFile: () => Promise<void>
  openConfigFolder: () => Promise<void>
  isLoading: boolean
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

interface ConfigProviderProps {
  children: ReactNode
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load config from Electron on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await window.electronAPI.config.get()
        setConfig(loadedConfig)

        // Apply opacity to the app
        const root = document.documentElement
        root.style.setProperty('--app-opacity', (loadedConfig.opacity / 100).toString())
      } catch (error) {
        console.error('Failed to load config:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return

    try {
      await window.electronAPI.config.update(updates)
      const updatedConfig = { ...config, ...updates }
      setConfig(updatedConfig)

      // Apply opacity immediately if it changed
      if (updates.opacity !== undefined) {
        const root = document.documentElement
        root.style.setProperty('--app-opacity', (updates.opacity / 100).toString())
      }
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  }

  const addMode = async (mode: Omit<AIMode, 'id'> & { id?: string }): Promise<string> => {
    try {
      const id = await window.electronAPI.config.addMode(mode)
      // Reload config to get the updated modes
      const updatedConfig = await window.electronAPI.config.get()
      setConfig(updatedConfig)
      return id
    } catch (error) {
      console.error('Failed to add mode:', error)
      throw error
    }
  }

  const updateMode = async (id: string, updates: Partial<Omit<AIMode, 'id'>>) => {
    try {
      await window.electronAPI.config.updateMode(id, updates)
      // Reload config to get the updated modes
      const updatedConfig = await window.electronAPI.config.get()
      setConfig(updatedConfig)
    } catch (error) {
      console.error('Failed to update mode:', error)
    }
  }

  const deleteMode = async (id: string) => {
    try {
      await window.electronAPI.config.deleteMode(id)
      // Reload config to get the updated modes
      const updatedConfig = await window.electronAPI.config.get()
      setConfig(updatedConfig)
    } catch (error) {
      console.error('Failed to delete mode:', error)
    }
  }

  const selectMode = async (id: string) => {
    try {
      await window.electronAPI.config.selectMode(id)
      if (config) {
        setConfig({ ...config, selectedModeId: id })
      }
    } catch (error) {
      console.error('Failed to select mode:', error)
    }
  }

  const getSelectedMode = (): AIMode | undefined => {
    if (!config) return undefined
    return config.modes.find((m) => m.id === config.selectedModeId)
  }

  const resetConfig = async () => {
    try {
      await window.electronAPI.config.reset()
      const updatedConfig = await window.electronAPI.config.get()
      setConfig(updatedConfig)

      // Apply opacity
      const root = document.documentElement
      root.style.setProperty('--app-opacity', (updatedConfig.opacity / 100).toString())
    } catch (error) {
      console.error('Failed to reset config:', error)
    }
  }

  const exportConfig = async (): Promise<string> => {
    try {
      return await window.electronAPI.config.export()
    } catch (error) {
      console.error('Failed to export config:', error)
      throw error
    }
  }

  const importConfig = async (configJson: string): Promise<boolean> => {
    try {
      const success = await window.electronAPI.config.import(configJson)
      if (success) {
        const updatedConfig = await window.electronAPI.config.get()
        setConfig(updatedConfig)

        // Apply opacity
        const root = document.documentElement
        root.style.setProperty('--app-opacity', (updatedConfig.opacity / 100).toString())
      }
      return success
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }

  const setApiKey = async (apiKey: string) => {
    try {
      await window.electronAPI.config.setApiKey(apiKey)
      if (config) {
        setConfig({ ...config, apiKey })
      }
    } catch (error) {
      console.error('Failed to set API key:', error)
    }
  }

  const getApiKey = async (): Promise<string> => {
    try {
      return await window.electronAPI.config.getApiKey()
    } catch (error) {
      console.error('Failed to get API key:', error)
      return ''
    }
  }

  const hasValidApiKey = async (): Promise<boolean> => {
    try {
      return await window.electronAPI.config.hasValidApiKey()
    } catch (error) {
      console.error('Failed to check API key validity:', error)
      return false
    }
  }

  const clearApiKey = async () => {
    try {
      await window.electronAPI.config.clearApiKey()
      if (config) {
        setConfig({ ...config, apiKey: '' })
      }
    } catch (error) {
      console.error('Failed to clear API key:', error)
    }
  }

  const getConfigPath = async (): Promise<string> => {
    try {
      return await window.electronAPI.config.getConfigPath()
    } catch (error) {
      console.error('Failed to get config path:', error)
      return ''
    }
  }

  const openConfigFile = async () => {
    try {
      await window.electronAPI.config.openConfigFile()
    } catch (error) {
      console.error('Failed to open config file:', error)
    }
  }

  const openConfigFolder = async () => {
    try {
      await window.electronAPI.config.openConfigFolder()
    } catch (error) {
      console.error('Failed to open config folder:', error)
    }
  }

  const updateOpacity = async (opacity: number) => {
    if (!config) return

    try {
      await window.electronAPI.config.update({ opacity })
      const updatedConfig = { ...config, opacity }
      setConfig(updatedConfig)
      // Note: CSS is already updated by the caller for immediate feedback
    } catch (error) {
      console.error('Failed to update opacity:', error)
    }
  }

  if (isLoading || !config) {
    return null
  }

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        updateOpacity,
        addMode,
        updateMode,
        deleteMode,
        selectMode,
        getSelectedMode,
        resetConfig,
        exportConfig,
        importConfig,
        setApiKey,
        getApiKey,
        hasValidApiKey,
        clearApiKey,
        getConfigPath,
        openConfigFile,
        openConfigFolder,
        isLoading
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
