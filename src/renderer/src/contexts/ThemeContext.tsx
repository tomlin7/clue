import React, { createContext, useContext, useEffect, useState } from 'react'

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
  const [theme, setTheme] = useState<Theme>('dark')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('clue-theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('clue-theme', theme)

    // Determine effective theme
    let newEffectiveTheme: 'light' | 'dark' = 'dark'

    if (theme === 'system') {
      newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      newEffectiveTheme = theme
    }

    setEffectiveTheme(newEffectiveTheme)

    // Apply theme to document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newEffectiveTheme)

    // Update CSS custom properties
    if (newEffectiveTheme === 'light') {
      root.style.setProperty('--panel-bg', 'rgba(255, 255, 255, 0.2)')
      root.style.setProperty('--panel-border', 'rgba(0, 0, 0, 0.1)')
      root.style.setProperty('--panel-hover-bg', 'rgba(255, 255, 255, 0.3)')
      root.style.setProperty('--panel-hover-border', 'rgba(0, 0, 0, 0.2)')
      root.style.setProperty('--text-primary', 'rgba(0, 0, 0, 0.9)')
      root.style.setProperty('--text-secondary', 'rgba(0, 0, 0, 0.7)')
      root.style.setProperty('--text-muted', 'rgba(0, 0, 0, 0.5)')
    } else {
      root.style.setProperty('--panel-bg', 'rgba(0, 0, 0, 0.2)')
      root.style.setProperty('--panel-border', 'rgba(255, 255, 255, 0.1)')
      root.style.setProperty('--panel-hover-bg', 'rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--panel-hover-border', 'rgba(255, 255, 255, 0.2)')
      root.style.setProperty('--text-primary', 'rgba(255, 255, 255, 0.9)')
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)')
      root.style.setProperty('--text-muted', 'rgba(255, 255, 255, 0.5)')
    }
  }, [theme])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light'
        setEffectiveTheme(newEffectiveTheme)

        // Update document classes and CSS properties
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(newEffectiveTheme)

        if (newEffectiveTheme === 'light') {
          root.style.setProperty('--panel-bg', 'rgba(255, 255, 255, 0.2)')
          root.style.setProperty('--panel-border', 'rgba(0, 0, 0, 0.1)')
          root.style.setProperty('--panel-hover-bg', 'rgba(255, 255, 255, 0.3)')
          root.style.setProperty('--panel-hover-border', 'rgba(0, 0, 0, 0.2)')
          root.style.setProperty('--text-primary', 'rgba(0, 0, 0, 0.9)')
          root.style.setProperty('--text-secondary', 'rgba(0, 0, 0, 0.7)')
          root.style.setProperty('--text-muted', 'rgba(0, 0, 0, 0.5)')
        } else {
          root.style.setProperty('--panel-bg', 'rgba(0, 0, 0, 0.2)')
          root.style.setProperty('--panel-border', 'rgba(255, 255, 255, 0.1)')
          root.style.setProperty('--panel-hover-bg', 'rgba(0, 0, 0, 0.3)')
          root.style.setProperty('--panel-hover-border', 'rgba(255, 255, 255, 0.2)')
          root.style.setProperty('--text-primary', 'rgba(255, 255, 255, 0.9)')
          root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)')
          root.style.setProperty('--text-muted', 'rgba(255, 255, 255, 0.5)')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
