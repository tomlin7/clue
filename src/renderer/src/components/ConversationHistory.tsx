import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ConversationSummary } from '@/types/conversation'
import { Clock, MessageCircle, Trash2 } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ConversationHistoryProps {
  sessions: ConversationSummary[]
  isVisible: boolean
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  currentSessionId?: string
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  sessions,
  isVisible,
  onSelectSession,
  onDeleteSession,
  currentSessionId
}) => {
  const { effectiveTheme } = useTheme()

  if (!isVisible) {
    return null
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card
      className="acrylic-panel w-80 max-h-96 overflow-hidden"
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <div className="p-3">
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-800'
          )}
        >
          Recent Conversations
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle
              className={cn(
                'h-8 w-8 mx-auto mb-2',
                effectiveTheme === 'dark' ? 'text-white/30' : 'text-gray-400'
              )}
            />
            <p className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500')}>
              No conversations yet
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'p-3 rounded-lg cursor-pointer group hover:bg-white/10 transition-colors relative',
                  currentSessionId === session.id
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-500/20 border border-blue-400/30'
                      : 'bg-blue-100/50 border border-blue-300/50'
                    : effectiveTheme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'bg-black/5 hover:bg-black/10'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={cn(
                          'text-sm font-medium truncate',
                          effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-800'
                        )}
                      >
                        {session.title}
                      </h4>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          effectiveTheme === 'dark'
                            ? 'bg-white/10 text-white/60'
                            : 'bg-black/10 text-zinc-600'
                        )}
                      >
                        {session.messageCount}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-xs leading-relaxed line-clamp-2',
                        effectiveTheme === 'dark' ? 'text-white/70' : 'text-zinc-600'
                      )}
                    >
                      {session.preview}
                    </p>

                    <div className="flex items-center gap-1 mt-2">
                      <Clock
                        size={10}
                        className={cn(
                          effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs',
                          effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500'
                        )}
                      >
                        {formatDate(session.lastModified)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className={cn(
                      'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                      effectiveTheme === 'dark'
                        ? 'text-white/50 hover:text-red-400 hover:bg-red-500/20'
                        : 'text-zinc-500 hover:text-red-600 hover:bg-red-100'
                    )}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
