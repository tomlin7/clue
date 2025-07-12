import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Copy, Maximize2, Minimize2, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

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
        className={cn('flex items-center justify-between py-1 px-2 bottom-border relative z-20 ')}
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
                    effectiveTheme === 'dark' ? 'border-zinc-400' : 'border-zinc-600'
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
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ className, children, ...props }) => {
                    return (
                      <code
                        className={cn(
                          className,
                          effectiveTheme === 'dark'
                            ? 'bg-white/15 text-blue-200 px-1 rounded'
                            : 'bg-gray-200/80 text-blue-800 px-1 rounded'
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre
                      className={cn(
                        'p-4 rounded-lg overflow-x-auto',
                        effectiveTheme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700'
                          : 'bg-gray-100 border border-gray-300'
                      )}
                    >
                      {children}
                    </pre>
                  ),
                  h1: ({ children }) => (
                    <h1
                      className={cn(
                        'text-xl font-bold mb-4',
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2
                      className={cn(
                        'text-lg font-semibold mb-3',
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3
                      className={cn(
                        'text-md font-medium mb-2',
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p
                      className={cn(
                        'mb-3',
                        effectiveTheme === 'dark' ? 'text-white/90' : 'text-gray-800'
                      )}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul
                      className={cn(
                        'list-disc pl-6 mb-3',
                        effectiveTheme === 'dark' ? 'text-white/90' : 'text-gray-800'
                      )}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol
                      className={cn(
                        'list-decimal pl-6 mb-3',
                        effectiveTheme === 'dark' ? 'text-white/90' : 'text-gray-800'
                      )}
                    >
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      className={cn(
                        'border-l-4 pl-4 py-2 mb-3 italic',
                        effectiveTheme === 'dark'
                          ? 'border-blue-400 bg-blue-500/10 text-blue-100'
                          : 'border-blue-500 bg-blue-50 text-blue-800'
                      )}
                    >
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-3">
                      <table
                        className={cn(
                          'min-w-full border-collapse',
                          effectiveTheme === 'dark'
                            ? 'border border-gray-600'
                            : 'border border-gray-300'
                        )}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th
                      className={cn(
                        'border px-4 py-2 text-left font-semibold',
                        effectiveTheme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-gray-100 text-gray-900'
                      )}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      className={cn(
                        'border px-4 py-2',
                        effectiveTheme === 'dark'
                          ? 'border-gray-600 text-white/90'
                          : 'border-gray-300 text-gray-800'
                      )}
                    >
                      {children}
                    </td>
                  )
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
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
