import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from './contexts/SettingsContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>
)
