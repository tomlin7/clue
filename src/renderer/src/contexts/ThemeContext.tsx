import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfig } from './ConfigContext'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, updateConfig } = useConfig()
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark')

  const setTheme = (theme: Theme) => {
    updateConfig({ theme })
  }

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (config.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        setEffectiveTheme(systemTheme)
      } else {
        setEffectiveTheme(config.theme)
      }
    }

    updateEffectiveTheme()

    if (config.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateEffectiveTheme)
      return () => mediaQuery.removeEventListener('change', updateEffectiveTheme)
    }

    return undefined
  }, [config.theme])

  useEffect(() => {
    const root = document.documentElement
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [effectiveTheme])

  return (
    <ThemeContext.Provider value={{ theme: config.theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
