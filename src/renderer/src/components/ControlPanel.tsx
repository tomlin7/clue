import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ControlPanelProps {
  onAskQuestion: (question: string) => void
  isRecording: boolean
  onToggleRecording: () => void
  transcription: string
  onOpenSettings: () => void
  className?: string
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  // @ts-ignore - keeping for future use when input form is re-enabled
  onAskQuestion,
  isRecording,
  onToggleRecording,
  transcription,
  onOpenSettings,
  className
}) => {
  const [recordingTime, setRecordingTime] = useState(0)
  const { effectiveTheme } = useTheme()

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

  return (
    <div
      className={cn(
        'acrylic-panel acrylic-panel-glow acrylic-panel-shimmer acrylic-panel-enhanced-shadow',
        'rounded-lg p-4 transition-all duration-300',
        'relative z-10',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <div className="flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRecording}
            className={cn(
              'h-8 w-8 rounded-full transition-all duration-200 relative z-20',
              isRecording
                ? effectiveTheme === 'dark'
                  ? 'bg-red-700/40 hover:bg-red-600/60 text-red-100 border border-red-500/30'
                  : 'bg-red-600/30 hover:bg-red-500/50 text-red-800 border border-red-400/40'
                : effectiveTheme === 'dark'
                  ? 'bg-blue-700/40 hover:bg-blue-600/60 text-blue-100 border border-blue-500/30'
                  : 'bg-blue-600/30 hover:bg-blue-500/50 text-blue-800 border border-blue-400/40'
            )}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
          {isRecording && (
            <Badge
              variant="destructive"
              className={cn(
                'animate-pulse border-0',
                effectiveTheme === 'dark'
                  ? 'bg-red-600/60 text-red-100'
                  : 'bg-red-500/70 text-red-900'
              )}
            >
              {formatTime(recordingTime)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs border-0 py-1',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/90'
                : 'bg-gray-200/70 text-gray-800'
            )}
          >
            Ask AI
          </Badge>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/80'
                : 'bg-gray-200/70 text-gray-700'
            )}
          >
            Ctrl
          </kbd>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/80'
                : 'bg-gray-200/70 text-gray-700'
            )}
          >
            ↵
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs border-0 py-1',
              effectiveTheme === 'dark'
                ? 'bg-white/10 text-white/70'
                : 'bg-gray-100/80 text-gray-600'
            )}
          >
            Show/Hide
          </Badge>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/80'
                : 'bg-gray-200/70 text-gray-700'
            )}
          >
            Ctrl
          </kbd>
          <kbd
            className={cn(
              'px-2 py-1 rounded text-xs',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/80'
                : 'bg-gray-200/70 text-gray-700'
            )}
          >
            \
          </kbd>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className={cn(
            'h-8 w-8 relative z-20',
            effectiveTheme === 'dark'
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
          )}
        >
          <Settings size={16} />
        </Button>
      </div>

      {/* <form onSubmit={handleSubmit} className="flex gap-2 relative z-20">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI about what you see..."
          className={cn(
            'flex-1 border backdrop-blur-sm',
            effectiveTheme === 'dark'
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40'
              : 'bg-white/60 border-gray-300/60 text-gray-900 placeholder:text-gray-500 focus:border-gray-400/60'
          )}
        />
        <Button
          type="submit"
          disabled={!question.trim()}
          className={cn(
            'transition-all duration-200',
            effectiveTheme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white'
              : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white'
          )}
        >
          Ask
        </Button>
      </form> */}

      {transcription && (
        <div
          className={cn(
            'mt-3 p-2 rounded-lg border relative z-20',
            effectiveTheme === 'dark'
              ? 'bg-green-500/20 border-green-500/30'
              : 'bg-green-100/80 border-green-300/50'
          )}
        >
          <p
            className={cn(
              'text-sm',
              effectiveTheme === 'dark' ? 'text-green-100' : 'text-green-800'
            )}
          >
            <strong>Transcription:</strong> {transcription}
          </p>
        </div>
      )}
    </div>
  )
}
