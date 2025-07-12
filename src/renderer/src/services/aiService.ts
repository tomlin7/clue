import { ConversationSession, ConversationSummary } from '@/types/conversation'
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export class AIService {
  private model: ChatGoogleGenerativeAI
  private currentSession: ConversationSession | null = null
  private apiKey: string
  private readonly SESSIONS_STORAGE_KEY = 'clue-conversation-sessions'
  private readonly CURRENT_SESSION_KEY = 'clue-current-session'

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey: this.apiKey
    })

    // Load or create current session
    this.loadCurrentSession()
  }

  private createSystemMessage(): SystemMessage {
    return new SystemMessage(
      `You are Clue, an AI assistant that helps users understand and interact with their screen content. 
        
Key capabilities:
- Analyze screenshots and describe what you see
- Answer questions about screen content and previous conversations
- Provide helpful suggestions and insights
- Remember context from previous interactions

Guidelines:
- Be concise but thorough in your responses
- Reference previous conversations when relevant
- Help users understand relationships between different screenshots or questions
- Maintain conversation context across multiple interactions`
    )
  }

  private generateSessionTitle(firstMessage: string): string {
    // Extract a meaningful title from the first message
    const words = firstMessage.trim().split(' ').slice(0, 5)
    return words.join(' ') + (firstMessage.length > words.join(' ').length ? '...' : '')
  }

  createNewSession(): ConversationSession {
    // Save current session if it exists
    if (this.currentSession) {
      this.saveSession(this.currentSession)
    }

    // Create new session
    const newSession: ConversationSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: 'New Conversation',
      messages: [this.createSystemMessage()],
      createdAt: new Date(),
      lastModified: new Date()
    }

    this.currentSession = newSession
    this.saveCurrentSession()
    return newSession
  }

  loadSession(sessionId: string): ConversationSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      this.currentSession = session
      this.saveCurrentSession()
      return session
    }
    return null
  }

  async analyzeScreenshot(imageData: string, transcription?: string): Promise<string> {
    try {
      // Ensure we have a current session
      if (!this.currentSession) {
        this.createNewSession()
      }

      // Double check currentSession is not null
      if (!this.currentSession) {
        throw new Error('Failed to create session')
      }

      const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder('history'),
        [
          'human',
          [
            {
              type: 'text',
              text: `Analyze this screenshot and provide helpful insights. ${
                transcription ? `Also consider this audio transcription: "${transcription}"` : ''
              }`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData
              }
            }
          ]
        ]
      ])

      const chain = RunnableSequence.from([prompt, this.model])

      const response = await chain.invoke({
        history: this.currentSession.messages
      })

      const userMessage = new HumanMessage(
        `Screenshot analysis request${transcription ? ` with transcription: "${transcription}"` : ''}`
      )
      const aiMessage = new AIMessage(response.content as string)

      // Update session title if this is the first non-system message
      if (this.currentSession.messages.length === 1) {
        this.currentSession.title = this.generateSessionTitle(userMessage.content as string)
      }

      // Add to conversation history
      this.currentSession.messages.push(userMessage, aiMessage)
      this.currentSession.lastModified = new Date()

      // Keep only last 20 messages to manage memory (excluding system message)
      if (this.currentSession.messages.length > 21) {
        const systemMsg = this.currentSession.messages[0]
        this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
      }

      // Save session
      this.saveCurrentSession()

      return response.content as string
    } catch (error) {
      console.error('Error analyzing screenshot:', error)
      throw new Error('Failed to analyze screenshot')
    }
  }

  async askQuestion(question: string): Promise<string> {
    try {
      // Ensure we have a current session
      if (!this.currentSession) {
        this.createNewSession()
      }

      // Double check currentSession is not null
      if (!this.currentSession) {
        throw new Error('Failed to create session')
      }

      const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder('history'),
        ['human', '{input}']
      ])

      const chain = RunnableSequence.from([prompt, this.model])

      const response = await chain.invoke({
        history: this.currentSession.messages,
        input: question
      })

      const userMessage = new HumanMessage(question)
      const aiMessage = new AIMessage(response.content as string)

      // Update session title if this is the first non-system message
      if (this.currentSession.messages.length === 1) {
        this.currentSession.title = this.generateSessionTitle(question)
      }

      // Add to conversation history
      this.currentSession.messages.push(userMessage, aiMessage)
      this.currentSession.lastModified = new Date()

      // Keep only last 20 messages to manage memory (excluding system message)
      if (this.currentSession.messages.length > 21) {
        const systemMsg = this.currentSession.messages[0]
        this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
      }

      // Save session
      this.saveCurrentSession()

      return response.content as string
    } catch (error) {
      console.error('Error asking question:', error)
      throw new Error('Failed to get AI response')
    }
  }

  clearHistory(): void {
    if (this.currentSession) {
      this.currentSession.messages = [this.createSystemMessage()]
      this.currentSession.title = 'New Conversation'
      this.currentSession.lastModified = new Date()
      this.saveCurrentSession()
    }
  }

  getCurrentSession(): ConversationSession | null {
    return this.currentSession
  }

  getConversationHistory(): BaseMessage[] {
    return this.currentSession ? [...this.currentSession.messages] : []
  }

  getAllSessions(): ConversationSession[] {
    try {
      const stored = localStorage.getItem(this.SESSIONS_STORAGE_KEY)
      if (stored) {
        const sessionsData = JSON.parse(stored)
        return sessionsData.map((sessionData: any) => ({
          ...sessionData,
          createdAt: new Date(sessionData.createdAt),
          lastModified: new Date(sessionData.lastModified),
          messages: sessionData.messages.map((msg: any) => {
            switch (msg.type) {
              case 'system':
                return new SystemMessage(msg.content)
              case 'human':
                return new HumanMessage(msg.content)
              case 'ai':
                return new AIMessage(msg.content)
              default:
                return new HumanMessage(msg.content)
            }
          })
        }))
      }
      return []
    } catch (error) {
      console.warn('Failed to load sessions:', error)
      return []
    }
  }

  getSessionSummaries(): ConversationSummary[] {
    const sessions = this.getAllSessions()
    return sessions
      .map((session) => {
        const userMessages = session.messages.filter((msg) => msg._getType() === 'human')
        const lastUserMessage = userMessages[userMessages.length - 1]

        return {
          id: session.id,
          title: session.title,
          preview: lastUserMessage
            ? typeof lastUserMessage.content === 'string'
              ? lastUserMessage.content.slice(0, 100) +
                (lastUserMessage.content.length > 100 ? '...' : '')
              : 'Complex message'
            : 'No messages',
          createdAt: session.createdAt,
          lastModified: session.lastModified,
          messageCount: Math.max(0, session.messages.length - 1) // Exclude system message
        }
      })
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions().filter((s) => s.id !== sessionId)
    this.saveSessions(sessions)

    // If we deleted the current session, create a new one
    if (this.currentSession?.id === sessionId) {
      this.createNewSession()
    }
  }

  private loadCurrentSession(): void {
    try {
      const stored = localStorage.getItem(this.CURRENT_SESSION_KEY)
      if (stored) {
        const sessionData = JSON.parse(stored)
        this.currentSession = {
          ...sessionData,
          createdAt: new Date(sessionData.createdAt),
          lastModified: new Date(sessionData.lastModified),
          messages: sessionData.messages.map((msg: any) => {
            switch (msg.type) {
              case 'system':
                return new SystemMessage(msg.content)
              case 'human':
                return new HumanMessage(msg.content)
              case 'ai':
                return new AIMessage(msg.content)
              default:
                return new HumanMessage(msg.content)
            }
          })
        }
      } else {
        this.createNewSession()
      }
    } catch (error) {
      console.warn('Failed to load current session:', error)
      this.createNewSession()
    }
  }

  private saveCurrentSession(): void {
    if (!this.currentSession) return

    try {
      const sessionData = {
        ...this.currentSession,
        messages: this.currentSession.messages.map((msg) => ({
          type: msg._getType(),
          content: msg.content
        }))
      }
      localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.warn('Failed to save current session:', error)
    }
  }

  private saveSession(session: ConversationSession): void {
    const sessions = this.getAllSessions()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    this.saveSessions(sessions)
  }

  private saveSessions(sessions: ConversationSession[]): void {
    try {
      const sessionsData = sessions.map((session) => ({
        ...session,
        messages: session.messages.map((msg) => ({
          type: msg._getType(),
          content: msg.content
        }))
      }))
      localStorage.setItem(this.SESSIONS_STORAGE_KEY, JSON.stringify(sessionsData))
    } catch (error) {
      console.warn('Failed to save sessions:', error)
    }
  }
}
