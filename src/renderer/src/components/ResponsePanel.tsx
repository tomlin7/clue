import { Copy, Maximize2, Minimize2, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  screenshot?: string
}

interface ResponsePanelProps {
  isVisible: boolean
  position: { x: number; y: number }
  onPanelInteractionStart: () => void
  onPanelInteractionEnd: () => void
  messages: Message[]
  isLoading: boolean
  onClearMessages: () => void
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  isVisible,
  position,
  onPanelInteractionStart,
  onPanelInteractionEnd,
  messages,
  isLoading,
  onClearMessages
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isVisible) return null

  const panelHeight = isMinimized ? 'auto' : '300px'

  return (
    <div
      className={cn(
        'fixed glass-panel rounded-lg panel-transition z-50',
        'shadow-lg border backdrop-blur-md'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y + 120}px`, // Position below control panel
        width: '400px',
        height: panelHeight,
        maxHeight: '400px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground/80">AI Response</span>
          {isLoading && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearMessages}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <div className="mb-2">Ready to assist you</div>
                <div className="text-xs">Press Ctrl+Enter to capture screen and ask AI</div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'rounded-lg p-3 text-sm',
                    message.type === 'user' ? 'bg-primary/20 ml-8' : 'bg-secondary/50 mr-8'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {message.screenshot && (
                        <div className="mb-2">
                          <img
                            src={message.screenshot}
                            alt="Screenshot"
                            className="max-w-full h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-secondary/50 mr-8 rounded-lg p-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                  <span className="text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
