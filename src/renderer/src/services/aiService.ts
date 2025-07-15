import { AppConfig } from '@/contexts/ConfigContext'
import { ConversationSession, ConversationSummary } from '@/types/conversation'
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export class AIService {
  private model: ChatGoogleGenerativeAI
  private currentSession: ConversationSession | null = null
  private config: AppConfig
  private readonly SESSIONS_STORAGE_KEY = 'clue-conversation-sessions'

  constructor(config: AppConfig) {
    this.config = config
    this.model = new ChatGoogleGenerativeAI({
      model: config.aiModel || 'gemini-2.0-flash',
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey: config.apiKey
    })

    // Always create a new session when app opens
    this.createNewSession()
  }

  private createSystemMessage(): SystemMessage {
    const selectedMode = this.config.modes.find((m) => m.id === this.config.selectedModeId)

    if (!selectedMode?.prompt) {
      // Fallback to first available mode
      const firstMode = this.config.modes[0]
      if (!firstMode?.prompt) {
        throw new Error('No modes available with prompts')
      }
      return new SystemMessage(firstMode.prompt)
    }

    return new SystemMessage(selectedMode.prompt)
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
    return newSession
  }

  loadSession(sessionId: string): ConversationSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      this.currentSession = session
      return session
    }
    return null
  }

  /**
   * Analyze a resume's extracted text and return a summary string of capabilities, industry, skills, achievements, education, etc.
   * The summary is concise and suitable for use as user context.
   */
  async analyzeResumePdf(resumeText: string): Promise<string> {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an expert resume analyst. 
  
  <input>
  Given a user's resume text, extract a concise, structured summary of their:
  - Short summary
  - Capabilities
  - Industry
  - Key skills
  - Achievements (if any)
  - Work experience (companies, roles, responsibilities) 
  - Certifications (if any)
  - Languages (if any)
  - Projects (if any)
  - Publications (if any)
  - Education (universities, degrees)

  <general_guidelines>
  - NEVER use meta-phrases (e.g., "let me help you", "I can see that").
  - NEVER provide unsolicited advice.
  - ALWAYS be specific, detailed, and accurate.
  - ALWAYS use markdown formatting.
  - ALWAYS acknowledge uncertainty when present.

  <output_format>
  - Respond in 1-2 paragraphs, using clear, readable text. 
  - Do not include the raw resume text in your response.`
        ],
        ['human', `Here is my resume text:\n${resumeText}`]
      ])

      const chain = RunnableSequence.from([prompt, this.model])
      const response = await chain.invoke({})

      // Return the text response
      return (response.content as string).trim()
    } catch (error) {
      console.error('Error analyzing resume text:', error)
      throw new Error('Failed to analyze resume text')
    }
  }

  async analyzeScreenshot(imageData: string): Promise<string> {
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
              text: 'Analyze the screen first.'
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

      const userMessage = new HumanMessage('Screenshot')
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
      this.saveSession(this.currentSession!)

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
      this.saveSession(this.currentSession!)

      return response.content as string
    } catch (error) {
      console.error('Error asking question:', error)
      throw new Error('Failed to get AI response')
    }
  }

  /**
   * Stream AI response for a question, calling onToken with each new chunk.
   */
  async askQuestionStream(question: string, onToken: (partial: string) => void): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession()
    }
    if (!this.currentSession) {
      throw new Error('Failed to create session')
    }
    // Build messages array: system/history + new human message
    const messages = [...this.currentSession.messages, new HumanMessage(question)]
    let fullResponse = ''
    let hadFirstToken = false
    const stream = await this.model.stream(messages)
    try {
      for await (const chunk of stream) {
        if (chunk?.content) {
          fullResponse += chunk.content
          onToken(fullResponse)
          hadFirstToken = true
        }
      }
    } catch (err) {
      console.error('[AIService] Streaming error (askQuestionStream):', err)
      if (!hadFirstToken) throw err
    }
    // Add to conversation history
    const userMessage = new HumanMessage(question)
    const aiMessage = new AIMessage(fullResponse)
    if (this.currentSession.messages.length === 1) {
      this.currentSession.title = this.generateSessionTitle(question)
    }
    this.currentSession.messages.push(userMessage, aiMessage)
    this.currentSession.lastModified = new Date()
    if (this.currentSession.messages.length > 21) {
      const systemMsg = this.currentSession.messages[0]
      this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
    }
    this.saveSession(this.currentSession!)
  }

  /**
   * Stream AI response for screenshot analysis, calling onToken with each new chunk.
   */
  async analyzeScreenshotStream(
    imageData: string,
    onToken: (partial: string) => void
  ): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession()
    }
    if (!this.currentSession) {
      throw new Error('Failed to create session')
    }
    // Build messages array: history + new human message with image and text
    const humanMsg = new HumanMessage({
      content: [
        {
          type: 'text',
          text: 'Analyze the screen first.'
        },
        {
          type: 'image_url',
          image_url: {
            url: imageData
          }
        }
      ]
    })
    const messages = [...this.currentSession.messages, humanMsg]
    let fullResponse = ''
    let hadFirstToken = false
    const stream = await this.model.stream(messages)
    try {
      for await (const chunk of stream) {
        if (chunk?.content) {
          fullResponse += chunk.content
          onToken(fullResponse)
          hadFirstToken = true
        }
      }
    } catch (err) {
      console.error('[AIService] Streaming error (analyzeScreenshotStream):', err)
      if (!hadFirstToken) throw err
    }
    const userMessage = new HumanMessage('Screenshot')
    const aiMessage = new AIMessage(fullResponse)
    if (this.currentSession.messages.length === 1) {
      this.currentSession.title = this.generateSessionTitle(userMessage.content as string)
    }
    this.currentSession.messages.push(userMessage, aiMessage)
    this.currentSession.lastModified = new Date()
    if (this.currentSession.messages.length > 21) {
      const systemMsg = this.currentSession.messages[0]
      this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
    }
    this.saveSession(this.currentSession!)
  }

  clearHistory(): void {
    if (this.currentSession) {
      this.currentSession.messages = [this.createSystemMessage()]
      this.currentSession.title = 'New Conversation'
      this.currentSession.lastModified = new Date()
      this.saveSession(this.currentSession!)
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

  updateConfig(newConfig: AppConfig): void {
    this.config = newConfig

    // Update the model if aiModel changed
    if (this.model.model !== newConfig.aiModel) {
      this.model = new ChatGoogleGenerativeAI({
        model: newConfig.aiModel,
        maxOutputTokens: 2048,
        temperature: 0.7,
        apiKey: newConfig.apiKey
      })
    }

    // Update current session's system message if mode changed
    if (this.currentSession && this.currentSession.messages.length > 0) {
      const newSystemMessage = this.createSystemMessage()
      this.currentSession.messages[0] = newSystemMessage
      this.saveSession(this.currentSession!)
    }
  }
}
