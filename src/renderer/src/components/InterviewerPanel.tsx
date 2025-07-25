import { cn } from '@/lib/utils'
import { useTheme } from '@renderer/contexts/ThemeContext'
import { AudioLines } from 'lucide-react'
import React from 'react'

interface QuestionPanelProps {
  transcription?: string
}

// Renamed to "Interview Question" and styled like ResponsePanel, no explicit header
export const InterviewerPanel: React.FC<QuestionPanelProps> = ({ transcription }) => {
  if (!transcription) return null
  // Show only the last N words (increased for more context)
  const N = 36
  const { effectiveTheme } = useTheme()
  const words = transcription.trim().split(/\s+/)
  const lastWords = words.length > N ? words.slice(-N).join(' ') : transcription

  return (
    <div
      className={cn(
        'acrylic-panel flex flex-col rounded-lg panel-transition relative z-10',
        effectiveTheme === 'dark' ? 'prose-invert' : 'prose-gray',
        'p-4',
        'mb-4'
      )}
      style={{
        minHeight: '60px',
        maxHeight: '200px',
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out, backdrop-filter 0.6s ease-out'
      }}
    >
      <div
        className={cn(
          'flex items-center gap-2 text-base mb-0',
          effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-600'
        )}
      >
        <span className="flex-shrink-0">
          <AudioLines
            size={20}
            className={cn(effectiveTheme === 'dark' ? 'text-blue-200' : 'text-blue-700')}
          />
        </span>
        {lastWords}
      </div>
    </div>
  )
}
