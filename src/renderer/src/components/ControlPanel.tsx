import { Camera, Mic, MicOff, Settings, Volume2, VolumeX } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface ControlPanelProps {
  isVisible: boolean
  position: { x: number; y: number }
  onPanelInteractionStart: () => void
  onPanelInteractionEnd: () => void
  isRecording: boolean
  onToggleRecording: () => void
  isAudioCapture: boolean
  onToggleAudioCapture: () => void
  onCapture: () => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isVisible,
  position,
  onPanelInteractionStart,
  onPanelInteractionEnd,
  isRecording,
  onToggleRecording,
  isAudioCapture,
  onToggleAudioCapture,
  onCapture
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseEnter = () => {
    onPanelInteractionStart()
  }

  const handleMouseLeave = () => {
    if (!isDragging) {
      onPanelInteractionEnd()
    }
  }

  const handleMouseDown = () => {
    setIsDragging(true)
    onPanelInteractionStart()
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    onPanelInteractionEnd()
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        onPanelInteractionEnd()
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging, onPanelInteractionEnd])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed glass-panel rounded-lg p-3 panel-transition z-50',
        'shadow-lg border backdrop-blur-md'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '280px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground/80">Clue AI</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleAudioCapture}>
            {isAudioCapture ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size="sm"
          onClick={onToggleRecording}
          className={cn('flex items-center space-x-2', isRecording && 'recording-pulse')}
        >
          {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          <span className="text-xs">{isRecording ? 'Stop' : 'Voice'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCapture}
          className="flex items-center space-x-2"
        >
          <Camera className="h-3 w-3" />
          <span className="text-xs">Capture</span>
        </Button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        <div>Ctrl+\ to toggle • Ctrl+Enter to capture</div>
        <div>Ctrl+M for voice • Ctrl+Arrows to move</div>
      </div>
    </div>
  )
}
