import { BaseMessage } from '@langchain/core/messages'

export interface ConversationSession {
  id: string
  title: string
  messages: BaseMessage[]
  createdAt: Date
  lastModified: Date
}

export interface ConversationSummary {
  id: string
  title: string
  preview: string
  createdAt: Date
  lastModified: Date
  messageCount: number
}
