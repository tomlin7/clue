import React, { useEffect, useState } from 'react'
import { ControlPanel } from './ControlPanel'
import { ResponsePanel } from './ResponsePanel'

interface PanelGroupProps {
  onAskQuestion: (question: string) => void
  response: string
  isLoading: boolean
  onClearResponse: () => void
  isRecording: boolean
  onToggleRecording: () => void
  transcription: string
  isVisible: boolean
  onSettingsClick: () => void
}

export const PanelGroup: React.FC<PanelGroupProps> = ({
  onAskQuestion,
  response,
  isLoading,
  onClearResponse,
  isRecording,
  onToggleRecording,
  transcription,
  isVisible,
  onSettingsClick
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 })

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
          onSettingsClick={onSettingsClick}
          className="animate-in fade-in-0 slide-in-from-top-4 duration-300"
        />

        <ResponsePanel
          response={response}
          isLoading={isLoading}
          onClear={onClearResponse}
          onFollowUp={onAskQuestion}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
        />
      </div>
    </div>
  )
}
