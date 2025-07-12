import { OnboardingPanel } from '@/components/onboarding'
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
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Initialize AI service when API key is available
  useEffect(() => {
    if (config.apiKey && config.apiKey.length > 0) {
      const newAiService = new AIService(config.apiKey)
      setAiService(newAiService)
    } else {
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
    // Check if we have a valid API key in config even if aiService is not ready
    if (!imageData) {
      return
    }

    if (!config.apiKey || config.apiKey.length === 0) {
      toast.error('Please set up your Google API key in settings first')
      return
    }

    if (!aiService) {
      const tempAiService = new AIService(config.apiKey)
      setAiService(tempAiService)

      // Use the temp service for this analysis
      setIsLoading(true)
      setResponse('')
      try {
        const currentTranscription = audioService.getCurrentTranscription()
        await tempAiService.analyzeScreenshotStream(imageData, currentTranscription, (partial) => {
          setResponse(partial)
        })
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
    setResponse('')
    try {
      const currentTranscription = audioService.getCurrentTranscription()
      await aiService.analyzeScreenshotStream(imageData, currentTranscription, (partial) => {
        setResponse(partial)
      })
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
    setResponse('')
    try {
      await aiService.askQuestionStream(question, (partial) => {
        setResponse(partial)
      })
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

  // Check if onboarding is completed
  useEffect(() => {
    const isOnboardingCompleted = localStorage.getItem('onboarding-completed')
    if (!isOnboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  return (
    <div className="dark h-screen w-screen bg-transparent overflow-hidden relative select-none">
      {/* Full-screen transparent overlay */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* Show main panels only if onboarding is completed */}
      {!showOnboarding && (
        <>
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
        </>
      )}

      {/* Onboarding Panel - shown only once at app start */}
      {showOnboarding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <OnboardingPanel onComplete={handleOnboardingComplete} className="w-[450px]" />
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
