import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ControlPanelProps {
  onAskQuestion: (question: string) => void
  isRecording: boolean
  onToggleRecording: () => void
  transcription: string
  className?: string
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onAskQuestion,
  isRecording,
  onToggleRecording,
  transcription,
  className
}) => {
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

  return (
    <div
      className={cn(
        'backdrop-blur-md bg-black/20 border border-white/10 rounded-2xl p-4 shadow-2xl',
        'transition-all duration-300 hover:bg-black/30 hover:border-white/20',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRecording}
            className={cn(
              'h-8 w-8 rounded-full transition-all duration-200',
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
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
          <Badge variant="secondary" className="text-xs">
            Ask AI
          </Badge>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘</kbd>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">↵</kbd>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Show/Hide
          </Badge>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘</kbd>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">\</kbd>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white">
          <Settings size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI about what you see..."
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
        />
        <Button
          type="submit"
          disabled={!question.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50"
        >
          Ask
        </Button>
      </form>

      {transcription && (
        <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-100">
            <strong>Transcription:</strong> {transcription}
          </p>
        </div>
      )}
    </div>
  )
}
