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
        <h3 className="text-sm font-medium text-white/90 mb-2">Recent Conversations</h3>
        <div className="space-y-2">
          {userMessages.map((message, index) => (
            <div key={index} className="text-xs">
              <div
                className={`p-2 rounded ${
                  message._getType() === 'human'
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'bg-green-500/20 text-green-100'
                }`}
              >
                <div className="font-medium text-white/70 mb-1">
                  {message._getType() === 'human' ? 'You:' : 'Clue:'}
                </div>
                <div className="text-white/90 leading-relaxed">
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
