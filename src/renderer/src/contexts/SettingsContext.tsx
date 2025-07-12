import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export interface Settings {
  opacity: number
  defaultPrompt: string
  aiModel: string
  position: { x: number; y: number }
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  opacity: 80,
  defaultPrompt: `You are Clue, an AI assistant that helps users understand and interact with their screen content. 
        
Key capabilities:
- Analyze screenshots and describe what you see
- Answer questions about screen content and previous conversations
- Provide helpful suggestions and insights
- Remember context from previous interactions

Guidelines:
- Be concise but thorough in your responses
- Reference previous conversations when relevant
- Help users understand relationships between different screenshots or questions
- Maintain conversation context across multiple interactions`,
  aiModel: 'gemini-2.0-flash',
  position: { x: 100, y: 100 }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('clue-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('clue-settings', JSON.stringify(settings))

    // Apply opacity to the app
    const root = document.documentElement
    root.style.setProperty('--app-opacity', (settings.opacity / 100).toString())
  }, [settings])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('clue-settings')
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
