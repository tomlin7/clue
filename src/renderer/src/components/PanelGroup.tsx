import { ConversationSummary } from '@/types/conversation'
import React, { useEffect, useState } from 'react'
import { ControlPanel } from './ControlPanel'
import { ConversationHistory } from './ConversationHistory'
import { ResponsePanel } from './ResponsePanel'

interface PanelGroupProps {
  onAskQuestion: (question: string) => void
  response: string
  isLoading: boolean
  onClearResponse: () => void
  onNewSession: () => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  isRecording: boolean
  onToggleRecording: () => void
  transcription: string
  isVisible: boolean
  onOpenSettings: () => void
  isSettingsOpen?: boolean
  conversationSessions?: ConversationSummary[]
  currentSessionId?: string
}

export const PanelGroup: React.FC<PanelGroupProps> = ({
  onAskQuestion,
  response,
  isLoading,
  onClearResponse,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  isRecording,
  onToggleRecording,
  transcription,
  isVisible,
  onOpenSettings,
  isSettingsOpen = false,
  conversationSessions = [],
  currentSessionId
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 })
  const [isHistoryVisible, setIsHistoryVisible] = useState(false)

  useEffect(() => {
    const getScreenSize = async () => {
      try {
        const size = await window.electronAPI.getScreenSize()
        if (size) {
          setScreenSize(size)
        }
      } catch (error) {
        console.error('Error getting screen size:', error)
      }
    }

    getScreenSize()
  }, [])

  useEffect(() => {
    const handleMovePanels = (_: Electron.IpcRendererEvent, direction: string) => {
      const step = 50
      setPosition((prev) => {
        let newX = prev.x
        let newY = prev.y

        switch (direction) {
          case 'up':
            newY = Math.max(0, prev.y - step)
            break
          case 'down':
            newY = Math.min(screenSize.height - 400, prev.y + step)
            break
          case 'left':
            newX = Math.max(0, prev.x - step)
            break
          case 'right':
            newX = Math.min(screenSize.width - 600, prev.x + step)
            break
        }

        return { x: newX, y: newY }
      })
    }

    window.electronAPI.onMovePanels(handleMovePanels)

    return () => {
      window.electronAPI.removeAllListeners('move-panels')
    }
  }, [screenSize])

  if (!isVisible) return null

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-300 ease-in-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '600px'
      }}
    >
      {/* Subtle position indicator */}
      {/* <div className="absolute -top-2 -left-2 w-1 h-1 bg-blue-400/50 rounded-full opacity-60 pointer-events-none" /> */}

      <div className="space-y-4 pointer-events-auto">
        <ControlPanel
          onAskQuestion={onAskQuestion}
          isRecording={isRecording}
          onToggleRecording={onToggleRecording}
          transcription={transcription}
          onOpenSettings={onOpenSettings}
          isSettingsOpen={isSettingsOpen}
          className="animate-in fade-in-0 slide-in-from-top-4 duration-300"
        />

        <ResponsePanel
          response={response}
          isLoading={isLoading}
          onClear={onClearResponse}
          onNewSession={onNewSession}
          onToggleHistory={() => setIsHistoryVisible(!isHistoryVisible)}
          isHistoryVisible={isHistoryVisible}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
        />

        {/* Show conversation history when visible */}
        <ConversationHistory
          sessions={conversationSessions}
          isVisible={isHistoryVisible}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          currentSessionId={currentSessionId}
        />
      </div>
    </div>
  )
}
