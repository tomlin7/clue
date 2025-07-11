import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Copy, Maximize2, Minimize2, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface ResponsePanelProps {
  response: string
  isLoading: boolean
  onClear: () => void
  className?: string
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  isLoading,
  onClear,
  className
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { effectiveTheme } = useTheme()

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

  const formatResponse = (text: string) => {
    if (!text) return ''

    // Basic markdown-like formatting with theme-aware styling
    const codeClass =
      effectiveTheme === 'dark'
        ? 'bg-white/15 text-blue-200 px-1 rounded'
        : 'bg-gray-200/80 text-blue-800 px-1 rounded'

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, `<code class="${codeClass}">$1</code>`)
      .replace(/\n/g, '<br>')
  }

  return (
    <div
      className={cn(
        'acrylic-panel acrylic-panel-glow acrylic-panel-shimmer acrylic-panel-enhanced-shadow',
        'rounded-lg transition-all duration-300 relative z-10',
        isMinimized ? 'h-16' : 'min-h-[300px] max-h-[600px]',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b relative z-20',
          effectiveTheme === 'dark' ? 'border-white/10' : 'border-black/10'
        )}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'border-0',
              effectiveTheme === 'dark'
                ? 'bg-white/15 text-white/90'
                : 'bg-gray-200/70 text-gray-800'
            )}
          >
            AI Response
          </Badge>
          {isAnalyzing && (
            <Badge
              variant="outline"
              className={cn(
                'animate-pulse border-0',
                effectiveTheme === 'dark'
                  ? 'bg-blue-500/20 text-blue-200'
                  : 'bg-blue-100/80 text-blue-700'
              )}
            >
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
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
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
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
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
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
            )}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <CardContent className="p-4 overflow-y-auto max-h-[500px] relative z-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'animate-spin rounded-lg h-6 w-6 border-b-2',
                    effectiveTheme === 'dark' ? 'border-blue-400' : 'border-blue-600'
                  )}
                ></div>
                <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                  Analyzing...
                </span>
              </div>
            </div>
          ) : response ? (
            <div
              ref={contentRef}
              className={cn(
                'prose prose-sm max-w-none',
                effectiveTheme === 'dark' ? 'prose-invert' : 'prose-gray'
              )}
              dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
            />
          ) : (
            <div className="text-center py-8">
              {/* <Sparkles
                className={cn(
                  'h-12 w-12 mx-auto mb-4',
                  effectiveTheme === 'dark' ? 'text-white/30' : 'text-gray-400'
                )}
              /> */}
              <p className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-gray-500')}>
                <Badge
                  className={cn(
                    'px-2 py-1 rounded',
                    effectiveTheme === 'dark'
                      ? 'bg-white/10 text-white/80'
                      : 'bg-gray-200/70 text-gray-700'
                  )}
                >
                  Ctrl+Enter
                </Badge>{' '}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </div>
  )
}
