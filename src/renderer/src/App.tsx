import { PanelGroup } from '@/components/PanelGroup'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Toaster } from '@/components/ui/sonner'
import { useConfig } from '@/contexts/ConfigContext'
import { AIService } from '@/services/aiService'
import { AudioService } from '@/services/audioService'
import { ConversationSummary } from '@/types/conversation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import './App.css'

function App() {
  const { config } = useConfig()
  const [aiService, setAiService] = useState<AIService | null>(null)
  const [audioService] = useState(() => new AudioService())
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [conversationSessions, setConversationSessions] = useState<ConversationSummary[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()

  // Initialize AI service when API key is available
  useEffect(() => {
    console.log('Config updated:', config)
    console.log('API Key from config:', config.apiKey)
    console.log('API Key length:', config.apiKey?.length)

    if (config.apiKey && config.apiKey.length > 0) {
      console.log('Creating new AI service with API key')
      const newAiService = new AIService(config.apiKey)
      setAiService(newAiService)
    } else {
      console.log('No valid API key, setting aiService to null')
      setAiService(null)
    }
  }, [config])

  // Update conversation sessions when aiService changes
  useEffect(() => {
    const updateSessions = () => {
      if (!aiService) {
        setConversationSessions([])
        setCurrentSessionId(undefined)
        return
      }

      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    }

    // Update immediately
    updateSessions()

    // Set up interval to check for updates
    const interval = setInterval(updateSessions, 1000)

    return () => clearInterval(interval)
  }, [aiService])

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
        }
      })

      // Handle microphone toggle
      window.electronAPI.onToggleMicrophone(() => {
        handleToggleRecording()
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
      window.electronAPI.removeAllListeners('screenshot-captured')
    }
  }, [isRecording, aiService])

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
    console.log('Screenshot analysis called')
    console.log('Image data available:', !!imageData)
    console.log('AI Service available:', !!aiService)
    console.log('Current config API key:', config.apiKey)
    console.log('Current config:', config)

    // Check if we have a valid API key in config even if aiService is not ready
    if (!imageData) {
      console.log('No image data provided')
      return
    }

    if (!config.apiKey || config.apiKey.length === 0) {
      console.log('No API key in config')
      toast.error('Please set up your Google API key in settings first')
      return
    }

    if (!aiService) {
      console.log('AI Service not initialized, creating new one with current API key')
      const tempAiService = new AIService(config.apiKey)
      setAiService(tempAiService)

      // Use the temp service for this analysis
      setIsLoading(true)
      try {
        const currentTranscription = audioService.getCurrentTranscription()
        const analysis = await tempAiService.analyzeScreenshot(imageData, currentTranscription)
        setResponse(analysis)

        // Update conversation sessions
        const sessions = tempAiService.getSessionSummaries()
        const currentSession = tempAiService.getCurrentSession()
        setConversationSessions(sessions)
        setCurrentSessionId(currentSession?.id)

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
      return
    }

    setIsLoading(true)
    try {
      const currentTranscription = audioService.getCurrentTranscription()
      const analysis = await aiService.analyzeScreenshot(imageData, currentTranscription)
      setResponse(analysis)

      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)

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
    if (!question.trim() || !aiService) {
      if (!aiService) {
        toast.error('Please set up your Google API key in settings first')
      }
      return
    }

    setIsLoading(true)
    try {
      const answer = await aiService.askQuestion(question)
      setResponse(answer)

      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)

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
    if (aiService) {
      aiService.clearHistory()

      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    }

    toast.success('Response cleared')
  }

  const handleNewSession = () => {
    if (!aiService) return

    const newSession = aiService.createNewSession()
    setResponse('')

    // Update conversation sessions
    const sessions = aiService.getSessionSummaries()
    setConversationSessions(sessions)
    setCurrentSessionId(newSession.id)

    toast.success('New conversation started')
  }

  const handleSelectSession = (sessionId: string) => {
    if (!aiService) return

    aiService.loadSession(sessionId)
    setResponse('')
    setCurrentSessionId(sessionId)
    toast.success('Conversation loaded')
  }

  const handleDeleteSession = (sessionId: string) => {
    if (!aiService) return

    aiService.deleteSession(sessionId)

    // Update conversation sessions
    const sessions = aiService.getSessionSummaries()
    const currentSession = aiService.getCurrentSession()
    setConversationSessions(sessions)
    setCurrentSessionId(currentSession?.id)

    toast.success('Conversation deleted')
  }

  const handleToggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  return (
    <div className="dark h-screen w-screen bg-transparent overflow-hidden relative select-none">
      {/* Full-screen transparent overlay */}
      <div className="absolute inset-0 pointer-events-none" />

      <PanelGroup
        onAskQuestion={handleAskQuestion}
        response={response}
        isLoading={isLoading}
        onClearResponse={handleClearResponse}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        transcription={transcription}
        isVisible={isVisible}
        onOpenSettings={handleToggleSettings}
        isSettingsOpen={isSettingsOpen}
        conversationSessions={conversationSessions}
        currentSessionId={currentSessionId}
      />

      {/* Settings Panel - positioned in top right of app */}
      {isSettingsOpen && (
        <div className="absolute top-4 right-4 z-50 pointer-events-auto">
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={handleCloseSettings}
            className="max-w-[400px]"
          />
        </div>
      )}

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

export default App
