import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Copy, Maximize2, Minimize2, Sparkles, Trash2 } from 'lucide-react'
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
        'backdrop-blur-md bg-black/20 border border-white/10 rounded-2xl shadow-2xl',
        'transition-all duration-300 hover:bg-black/30 hover:border-white/20',
        isMinimized ? 'h-16' : 'min-h-[300px] max-h-[600px]',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-100">
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
            className="h-8 w-8 text-white/70 hover:text-white"
            disabled={!response}
          >
            <Copy size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 text-white/70 hover:text-white"
            disabled={!response}
          >
            <Trash2 size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white/70 hover:text-white"
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="text-white/70">Analyzing...</span>
              </div>
            </div>
          ) : response ? (
            <div
              ref={contentRef}
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
            />
          ) : (
            <div className="text-center py-8 text-white/50">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                Press <kbd className="bg-white/10 px-2 py-1 rounded">Ctrl+Enter</kbd> to capture
                screen and ask AI
              </p>
            </div>
          )}
        </CardContent>
      )}
    </div>
  )
}
