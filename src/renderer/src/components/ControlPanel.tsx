import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Settings, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ControlPanelProps {
  onAskQuestion: (question: string) => void
  isRecording: boolean
  onToggleRecording: () => void
  transcription: string
  onSettingsClick: () => void
  className?: string
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onAskQuestion,
  isRecording,
  onToggleRecording,
  transcription,
  onSettingsClick,
  className
}) => {
  const { effectiveTheme } = useTheme()
  const [question, setQuestion] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      onAskQuestion(question)
      setQuestion('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleClose = () => {
    window.electronAPI.closeApp()
  }

  return (
    <div
      className={cn(
        'backdrop-blur-md border rounded-lg p-4 shadow-2xl',
        'transition-all duration-300',
        effectiveTheme === 'dark'
          ? 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
          : 'bg-white/20 border-black/10 hover:bg-white/30 hover:border-black/20',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRecording}
            className={cn(
              'h-8 w-8 rounded-full transition-all duration-200',
              isRecording
                ? 'bg-red-700/30 hover:bg-red-600 text-white'
                : 'bg-blue-700/30 hover:bg-blue-600 text-white'
            )}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              {formatTime(recordingTime)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs px-2 py-1',
              effectiveTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
            )}
          >
            Ask AI
          </Badge>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            ⌘
          </kbd>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            ↵
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs px-2 py-1',
              effectiveTheme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
            )}
          >
            Show/Hide
          </Badge>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            ⌘
          </kbd>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            \
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className={cn(
              'h-8 w-8',
              effectiveTheme === 'dark'
                ? 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                : 'bg-black/10 text-black/70 hover:text-black hover:bg-black/20'
            )}
          >
            <Settings size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={cn(
              'h-8 w-8',
              effectiveTheme === 'dark'
                ? 'bg-red-600/20 text-red-400 hover:text-white hover:bg-red-600'
                : 'bg-red-600/20 text-red-600 hover:text-white hover:bg-red-600'
            )}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI about what you see..."
          className={cn(
            'flex-1 border focus:border-opacity-40',
            effectiveTheme === 'dark'
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40'
              : 'bg-black/10 border-black/20 text-black placeholder:text-black/50 focus:border-black/40'
          )}
        />
        <Button
          type="submit"
          disabled={!question.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white"
        >
          Ask
        </Button>
      </form> */}

      {transcription && (
        <div
          className={cn(
            'mt-3 p-2 border rounded-lg',
            effectiveTheme === 'dark'
              ? 'bg-green-500/20 border-green-500/30 text-green-100'
              : 'bg-green-500/20 border-green-500/30 text-green-800'
          )}
        >
          <p className="text-sm">
            <strong>Transcription:</strong> {transcription}
          </p>
        </div>
      )}
    </div>
  )
}
