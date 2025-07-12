import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { BaseMessage } from '@langchain/core/messages'
import React from 'react'
import { Card } from './ui/card'

interface ConversationHistoryProps {
  messages: BaseMessage[]
  isVisible: boolean
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  messages,
  isVisible
}) => {
  const { effectiveTheme } = useTheme()

  if (!isVisible || messages.length === 0) {
    return null
  }

  // Filter out system messages and get recent user/ai pairs
  const userMessages = messages
    .filter((msg) => msg._getType() === 'human' || msg._getType() === 'ai')
    .slice(-6) // Show last 3 conversations (6 messages)

  if (userMessages.length === 0) {
    return null
  }

  return (
    <Card className="acrylic-panel w-80 max-h-60 overflow-y-auto">
      <div className="p-3">
        <h3
          className={cn(
            'text-sm font-medium mb-2',
            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-800'
          )}
        >
          Recent Conversations
        </h3>
        <div className="space-y-2">
          {userMessages.map((message, index) => (
            <div key={index} className="text-xs">
              <div
                className={cn(
                  'p-2 rounded',
                  message._getType() === 'human'
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'bg-blue-100/70 text-blue-800'
                    : effectiveTheme === 'dark'
                      ? 'bg-green-500/20 text-green-100'
                      : 'bg-green-100/70 text-green-800'
                )}
              >
                <div
                  className={cn(
                    'font-medium mb-1',
                    effectiveTheme === 'dark' ? 'text-white/70' : 'text-zinc-600'
                  )}
                >
                  {message._getType() === 'human' ? 'You:' : 'Clue:'}
                </div>
                <div
                  className={cn(
                    'leading-relaxed',
                    effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                  )}
                >
                  {typeof message.content === 'string'
                    ? message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '')
                    : 'Complex message'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
