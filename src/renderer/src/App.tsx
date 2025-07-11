import { PanelGroup } from '@/components/PanelGroup'
import { SettingsPanel } from '@/components/SettingsPanel'
import { TitleBar } from '@/components/TitleBar'
import { Toaster } from '@/components/ui/sonner'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { AIService } from '@/services/aiService'
import { AudioService } from '@/services/audioService'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import './App.css'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'your-google-api-key-here'

function AppContent() {
  const { theme, setTheme } = useTheme()
  const [aiService] = useState(() => new AIService(GOOGLE_API_KEY))
  const [audioService] = useState(() => new AudioService())
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const setupElectronListeners = () => {
      // Handle visibility toggle
      window.electronAPI.onToggleVisibility((_, visible: boolean) => {
        setIsVisible(visible)
        if (!visible) {
          // Clean up when hidden
          if (isRecording) {
            handleToggleRecording()
          }
          setIsSettingsOpen(false)
        }
      })

      // Handle microphone toggle
      window.electronAPI.onToggleMicrophone(() => {
        handleToggleRecording()
      })

      // Handle theme toggle
      window.electronAPI.onToggleTheme(() => {
        const themes = ['light', 'dark', 'system'] as const
        const currentIndex = themes.indexOf(theme)
        const nextIndex = (currentIndex + 1) % themes.length
        setTheme(themes[nextIndex])
      })

      // Handle screenshot capture
      window.electronAPI.onScreenshotCaptured((_, imageData: string) => {
        handleScreenshotAnalysis(imageData)
      })
    }

    setupElectronListeners()

    return () => {
      window.electronAPI.removeAllListeners('toggle-visibility')
      window.electronAPI.removeAllListeners('toggle-microphone')
      window.electronAPI.removeAllListeners('toggle-theme')
      window.electronAPI.removeAllListeners('screenshot-captured')
    }
  }, [isRecording, setTheme])

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        await audioService.stopRecording()
        setIsRecording(false)
        const currentTranscription = audioService.getCurrentTranscription()
        setTranscription(currentTranscription)
        toast.success('Recording stopped')
      } else {
        await audioService.startRecording()
        setIsRecording(true)
        setTranscription('')
        audioService.clearTranscription()
        toast.success('Recording started')
      }
    } catch (error) {
      console.error('Error toggling recording:', error)
      toast.error('Failed to toggle recording')
    }
  }

  const handleScreenshotAnalysis = async (imageData: string) => {
    if (!imageData) return

    setIsLoading(true)
    try {
      const currentTranscription = audioService.getCurrentTranscription()
      const analysis = await aiService.analyzeScreenshot(imageData, currentTranscription)
      setResponse(analysis)

      // Clear transcription after use
      if (currentTranscription) {
        setTranscription('')
        audioService.clearTranscription()
      }

      toast.success('Screenshot analyzed')
    } catch (error) {
      console.error('Error analyzing screenshot:', error)
      toast.error('Failed to analyze screenshot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const answer = await aiService.askQuestion(question)
      setResponse(answer)
      toast.success('Question answered')
    } catch (error) {
      console.error('Error asking question:', error)
      toast.error('Failed to get answer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearResponse = () => {
    setResponse('')
    aiService.clearHistory()
    toast.success('Response cleared')
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden relative select-none">
      {/* Full-screen transparent overlay */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* Title Bar */}
      <TitleBar />

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed top-4 right-4 z-50">
          <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
      )}

      <PanelGroup
        onAskQuestion={handleAskQuestion}
        response={response}
        isLoading={isLoading}
        onClearResponse={handleClearResponse}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        transcription={transcription}
        isVisible={isVisible}
        onSettingsClick={handleSettingsClick}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }
        }}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App
