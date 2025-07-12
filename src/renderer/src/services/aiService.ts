import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export class AIService {
  private model: ChatGoogleGenerativeAI
  private conversationHistory: BaseMessage[] = []
  private apiKey: string
  private readonly STORAGE_KEY = 'clue-conversation-history'

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey: this.apiKey
    })

    // Load conversation history from localStorage
    this.loadHistory()

    // Add system message if this is a fresh conversation
    if (this.conversationHistory.length === 0) {
      this.conversationHistory.push(
        new SystemMessage(
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
      )
    }
  }

  async analyzeScreenshot(imageData: string, transcription?: string): Promise<string> {
    try {
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
        history: this.conversationHistory
      })

      // Add to conversation history
      this.conversationHistory.push(
        new HumanMessage(
          `Screenshot analysis request${transcription ? ` with transcription: "${transcription}"` : ''}`
        )
      )
      this.conversationHistory.push(new AIMessage(response.content as string))

      // Keep only last 20 messages to manage memory
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      // Save to localStorage
      this.saveHistory()

      return response.content as string
    } catch (error) {
      console.error('Error analyzing screenshot:', error)
      throw new Error('Failed to analyze screenshot')
    }
  }

  async askQuestion(question: string): Promise<string> {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder('history'),
        ['human', '{input}']
      ])

      const chain = RunnableSequence.from([prompt, this.model])

      const response = await chain.invoke({
        history: this.conversationHistory,
        input: question
      })

      // Add to conversation history
      this.conversationHistory.push(new HumanMessage(question))
      this.conversationHistory.push(new AIMessage(response.content as string))

      // Keep only last 20 messages to manage memory
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }

      // Save to localStorage
      this.saveHistory()

      return response.content as string
    } catch (error) {
      console.error('Error asking question:', error)
      throw new Error('Failed to get AI response')
    }
  }

  clearHistory(): void {
    this.conversationHistory = []
    localStorage.removeItem(this.STORAGE_KEY)

    // Re-add system message for fresh conversation
    this.conversationHistory.push(
      new SystemMessage(
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
    )
    this.saveHistory()
  }

  getHistoryLength(): number {
    return this.conversationHistory.length
  }

  getConversationHistory(): BaseMessage[] {
    // Return a copy to prevent external modification
    return [...this.conversationHistory]
  }

  getLastMessages(count: number = 5): BaseMessage[] {
    // Get the last N messages, excluding system messages
    const userMessages = this.conversationHistory.filter(
      (msg) => msg._getType() === 'human' || msg._getType() === 'ai'
    )
    return userMessages.slice(-count * 2) // *2 because each interaction has human + ai message
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const historyData = JSON.parse(stored)
        this.conversationHistory = historyData.map((msg: any) => {
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
    } catch (error) {
      console.warn('Failed to load conversation history:', error)
      this.conversationHistory = []
    }
  }

  private saveHistory(): void {
    try {
      const historyData = this.conversationHistory.map((msg) => ({
        type: msg._getType(),
        content: msg.content
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(historyData))
    } catch (error) {
      console.warn('Failed to save conversation history:', error)
    }
  }
}
