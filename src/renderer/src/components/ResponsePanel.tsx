import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Copy, Maximize2, Minimize2, Send, Sparkles, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface ResponsePanelProps {
  response: string
  isLoading: boolean
  onClear: () => void
  onFollowUp?: (question: string) => void
  className?: string
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  isLoading,
  onClear,
  onFollowUp,
  className
}) => {
  const { effectiveTheme } = useTheme()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading) {
      setIsAnalyzing(true)
    } else {
      setIsAnalyzing(false)
    }
  }, [isLoading])

  const handleCopy = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(response)
      } catch (error) {
        console.error('Failed to copy text:', error)
      }
    }
  }

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (followUpQuestion.trim() && onFollowUp) {
      onFollowUp(followUpQuestion)
      setFollowUpQuestion('')
    }
  }

  const formatResponse = (text: string) => {
    if (!text) return ''

    // Basic markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div
      className={cn(
        'backdrop-blur-md border rounded-lg shadow-xl',
        'transition-all duration-300',
        isMinimized ? 'h-16' : 'min-h-[300px] max-h-[600px]',
        effectiveTheme === 'dark'
          ? 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
          : 'bg-white/20 border-black/10 hover:bg-white/30 hover:border-black/20',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b',
          effectiveTheme === 'dark' ? 'border-white/10' : 'border-black/10'
        )}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
            )}
          >
            AI Response
          </Badge>
          {isAnalyzing && (
            <Badge variant="outline" className="animate-pulse">
              Analyzing screen...
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              'h-8 w-8',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-black/70 hover:text-black hover:bg-black/10'
            )}
            disabled={!response}
          >
            <Copy size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className={cn(
              'h-8 w-8',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-black/70 hover:text-black hover:bg-black/10'
            )}
            disabled={!response}
          >
            <Trash2 size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className={cn(
              'h-8 w-8',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-black/70 hover:text-black hover:bg-black/10'
            )}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <CardContent className="p-4 overflow-y-auto max-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'animate-spin rounded-lg h-6 w-6 border-b-2',
                    effectiveTheme === 'dark' ? 'border-blue-400' : 'border-blue-600'
                  )}
                ></div>
                <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                  Analyzing...
                </span>
              </div>
            </div>
          ) : response ? (
            <div className="space-y-4">
              <div
                ref={contentRef}
                className={cn(
                  'prose prose-sm max-w-none',
                  effectiveTheme === 'dark' ? 'prose-invert' : 'prose-slate'
                )}
                dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
              />

              {/* Follow-up question form */}
              {onFollowUp && (
                <form
                  onSubmit={handleFollowUpSubmit}
                  className="flex gap-2 pt-4 border-t border-white/10"
                >
                  <Input
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className={cn(
                      'flex-1 border',
                      effectiveTheme === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50'
                        : 'bg-black/10 border-black/20 text-black placeholder:text-black/50'
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!followUpQuestion.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white"
                  >
                    <Send size={14} />
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles
                className={cn(
                  'h-12 w-12 mx-auto mb-4 opacity-50',
                  effectiveTheme === 'dark' ? 'text-white' : 'text-black'
                )}
              />
              <p className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-black/50')}>
                Press{' '}
                <kbd
                  className={cn(
                    'px-2 py-1 rounded',
                    effectiveTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
                  )}
                >
                  Ctrl+Enter
                </kbd>{' '}
                to capture screen and ask AI
              </p>
            </div>
          )}
        </CardContent>
      )}
    </div>
  )
}
