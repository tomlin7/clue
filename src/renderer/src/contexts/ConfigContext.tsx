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
  language: string
}

export interface InterviewProfile {
  id: string
  name: string
  icon: string
  prompt: string
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
  interviewProfiles: InterviewProfile[]
  selectedInterviewProfileId: string
  tools: string[] // e.g., ['google-search']
  resumeAnalysis?: string
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
  // Interview profiles
  addInterviewProfile: (profile: Omit<InterviewProfile, 'id'> & { id?: string }) => Promise<string>
  updateInterviewProfile: (
    id: string,
    updates: Partial<Omit<InterviewProfile, 'id'>>
  ) => Promise<void>
  deleteInterviewProfile: (id: string) => Promise<void>
  selectInterviewProfile: (id: string) => Promise<void>
  getSelectedInterviewProfile: () => InterviewProfile | undefined
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
  updateResumeAnalysis: (analysis: string) => Promise<void>
  isLoading: boolean
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

interface ConfigProviderProps {
  children: ReactNode
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const defaultTools = ['google-search']
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Default interview profiles
  const defaultInterviewProfiles: InterviewProfile[] = [
    {
      id: 'interview',
      name: 'Interview',
      icon: '🎤',
      prompt: 'Assist with job interviews.'
    },
    {
      id: 'sales',
      name: 'Sales',
      icon: '💼',
      prompt: 'Assist with sales calls.'
    },
    {
      id: 'meeting',
      name: 'Meeting',
      icon: '📅',
      prompt: 'Assist with meetings.'
    },
    {
      id: 'presentation',
      name: 'Presentation',
      icon: '📊',
      prompt: 'Assist with presentations.'
    },
    {
      id: 'negotiation',
      name: 'Negotiation',
      icon: '🤝',
      prompt: 'Assist with negotiations.'
    },
    {
      id: 'exam',
      name: 'Exam',
      icon: '📝',
      prompt: 'Assist with exams.'
    }
  ]

  // Load config from Electron on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await window.electronAPI.config.get()
        const loadedProfiles = (loadedConfig as any).interviewProfiles ?? defaultInterviewProfiles
        const loadedSelectedProfileId =
          (loadedConfig as any).selectedInterviewProfileId ??
          (loadedProfiles[0]?.id || defaultInterviewProfiles[0].id)
        setConfig({
          ...loadedConfig,
          tools: loadedConfig.tools ?? defaultTools,
          interviewProfiles: loadedProfiles,
          selectedInterviewProfileId: loadedSelectedProfileId
        })

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
  // Interview profile helpers
  const addInterviewProfile = async (
    profile: Omit<InterviewProfile, 'id'> & { id?: string }
  ): Promise<string> => {
    if (!config) throw new Error('Config not loaded')
    const id = profile.id || Math.random().toString(36).slice(2)
    const newProfile: InterviewProfile = { ...profile, id } as InterviewProfile
    const updatedProfiles = [...config.interviewProfiles, newProfile]
    await updateConfig({ interviewProfiles: updatedProfiles })
    return id
  }

  const updateInterviewProfile = async (
    id: string,
    updates: Partial<Omit<InterviewProfile, 'id'>>
  ) => {
    if (!config) return
    const updatedProfiles = config.interviewProfiles.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
    await updateConfig({ interviewProfiles: updatedProfiles })
  }

  const deleteInterviewProfile = async (id: string) => {
    if (!config) return
    const updatedProfiles = config.interviewProfiles.filter((p) => p.id !== id)
    await updateConfig({ interviewProfiles: updatedProfiles })
  }

  const selectInterviewProfile = async (id: string) => {
    if (!config) return
    await updateConfig({ selectedInterviewProfileId: id })
  }

  const getSelectedInterviewProfile = (): InterviewProfile | undefined => {
    if (!config) return undefined
    return config.interviewProfiles.find((p) => p.id === config.selectedInterviewProfileId)
  }

  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return

    try {
      await window.electronAPI.config.update(updates)
      const updatedConfig = { ...config, ...updates }
      const updatedProfiles = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles,
        selectedInterviewProfileId: updatedSelectedProfileId
      })

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
      const updatedProfiles2 = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId2 =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles2[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles2,
        selectedInterviewProfileId: updatedSelectedProfileId2
      })
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
      const updatedProfiles3 = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId3 =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles3[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles3,
        selectedInterviewProfileId: updatedSelectedProfileId3
      })
    } catch (error) {
      console.error('Failed to update mode:', error)
    }
  }

  const deleteMode = async (id: string) => {
    try {
      await window.electronAPI.config.deleteMode(id)
      // Reload config to get the updated modes
      const updatedConfig = await window.electronAPI.config.get()
      const updatedProfiles5 = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId5 =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles5[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles5,
        selectedInterviewProfileId: updatedSelectedProfileId5
      })
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
      const updatedProfiles7 = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId7 =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles7[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles7,
        selectedInterviewProfileId: updatedSelectedProfileId7
      })

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
        const updatedProfiles6 =
          (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
        const updatedSelectedProfileId6 =
          (updatedConfig as any).selectedInterviewProfileId ??
          (updatedProfiles6[0]?.id || defaultInterviewProfiles[0].id)
        setConfig({
          ...updatedConfig,
          tools: updatedConfig.tools ?? defaultTools,
          interviewProfiles: updatedProfiles6,
          selectedInterviewProfileId: updatedSelectedProfileId6
        })

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
        setConfig({
          ...config,
          apiKey,
          tools: config.tools ?? defaultTools,
          interviewProfiles: config.interviewProfiles ?? defaultInterviewProfiles,
          selectedInterviewProfileId:
            config.selectedInterviewProfileId ??
            (config.interviewProfiles?.[0]?.id || defaultInterviewProfiles[0].id)
        })
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
        setConfig({
          ...config,
          apiKey: '',
          tools: config.tools ?? defaultTools,
          interviewProfiles: config.interviewProfiles ?? defaultInterviewProfiles,
          selectedInterviewProfileId:
            config.selectedInterviewProfileId ??
            (config.interviewProfiles?.[0]?.id || defaultInterviewProfiles[0].id)
        })
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
      const updatedProfiles4 = (updatedConfig as any).interviewProfiles ?? defaultInterviewProfiles
      const updatedSelectedProfileId4 =
        (updatedConfig as any).selectedInterviewProfileId ??
        (updatedProfiles4[0]?.id || defaultInterviewProfiles[0].id)
      setConfig({
        ...updatedConfig,
        tools: updatedConfig.tools ?? defaultTools,
        interviewProfiles: updatedProfiles4,
        selectedInterviewProfileId: updatedSelectedProfileId4
      })
      // Note: CSS is already updated by the caller for immediate feedback
    } catch (error) {
      console.error('Failed to update opacity:', error)
    }
  }

  // Add or update resume analysis
  const updateResumeAnalysis = async (analysis: string) => {
    if (!config) return
    await updateConfig({ resumeAnalysis: analysis })
  }

  if (isLoading || !config) {
    return null
  }

  return (
    <ConfigContext.Provider
      value={{
        config: config!,
        updateConfig,
        updateOpacity,
        addMode,
        updateMode,
        deleteMode,
        selectMode,
        getSelectedMode,
        addInterviewProfile,
        updateInterviewProfile,
        deleteInterviewProfile,
        selectInterviewProfile,
        getSelectedInterviewProfile,
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
        updateResumeAnalysis,
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
