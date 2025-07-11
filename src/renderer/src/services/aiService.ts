import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export class AIService {
  private model: ChatGoogleGenerativeAI
  private conversationHistory: BaseMessage[] = []
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey: this.apiKey
    })
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

      return response.content as string
    } catch (error) {
      console.error('Error asking question:', error)
      throw new Error('Failed to get AI response')
    }
  }

  clearHistory(): void {
    this.conversationHistory = []
  }

  getHistoryLength(): number {
    return this.conversationHistory.length
  }
}
