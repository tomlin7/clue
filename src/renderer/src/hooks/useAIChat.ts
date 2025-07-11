import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableWithMessageHistory } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { useCallback, useRef, useState } from 'react'

interface ChatSession {
  id: string
  history: InMemoryChatMessageHistory
}

export const useAIChat = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatSessionRef = useRef<ChatSession | null>(null)
  const modelRef = useRef<ChatGoogleGenerativeAI | null>(null)

  // Initialize the model and chat session
  const initializeChat = useCallback(() => {
    if (!modelRef.current) {
      // Note: In production, the API key should be provided by the user or stored securely
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY_HERE'

      modelRef.current = new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxOutputTokens: 2048
      })
    }

    if (!chatSessionRef.current) {
      chatSessionRef.current = {
        id: 'clue-session-' + Date.now(),
        history: new InMemoryChatMessageHistory()
      }

      // Add system message to establish context
      chatSessionRef.current.history.addMessage(
        new SystemMessage(`You are Clue, an AI assistant that helps users understand and interact with their screen content. 

Key capabilities:
- Analyze screenshots and describe what you see
- Answer questions about screen content
- Provide helpful suggestions and insights
- Remember context from previous interactions in this session

Guidelines:
- Be concise but thorough in your responses
- Focus on what's actually visible in screenshots
- Provide actionable insights when possible
- Maintain conversation context and memory
- Be helpful and friendly

When analyzing screenshots, describe:
1. What applications or content are visible
2. Key elements, text, or data shown
3. Potential actions the user might want to take
4. Any notable patterns or insights`)
      )
    }
  }, [])

  const sendMessage = useCallback(
    async (message: string, screenshot?: string): Promise<string> => {
      setIsLoading(true)
      setError(null)

      try {
        initializeChat()

        if (!modelRef.current || !chatSessionRef.current) {
          throw new Error('Failed to initialize chat session')
        }

        // Create the user message
        let userMessageContent = message

        if (screenshot) {
          // For screenshot analysis, enhance the message
          userMessageContent = `${message}\n\n[Screenshot provided for analysis]`

          // Note: In a real implementation, you would need to handle image input
          // Gemini Vision API supports image analysis, but requires proper image handling
          // For now, we'll work with text-based analysis
        }

        // Add user message to history
        await chatSessionRef.current.history.addMessage(new HumanMessage(userMessageContent))

        // Create prompt template with message history
        const prompt = ChatPromptTemplate.fromMessages([
          new SystemMessage(
            `You are Clue, an AI assistant that helps users understand and interact with their screen content.`
          ),
          new MessagesPlaceholder('history'),
          ['human', '{input}']
        ])

        // Create runnable with message history
        const chainWithHistory = new RunnableWithMessageHistory({
          runnable: prompt.pipe(modelRef.current),
          getMessageHistory: () => chatSessionRef.current!.history,
          inputMessagesKey: 'input',
          historyMessagesKey: 'history'
        })

        // Get response from AI
        const response = await chainWithHistory.invoke(
          { input: userMessageContent },
          { configurable: { sessionId: chatSessionRef.current.id } }
        )

        const responseText = response.content as string

        // Add AI response to history
        await chatSessionRef.current.history.addMessage(new AIMessage(responseText))

        return responseText
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)

        // Return a fallback response
        if (errorMessage.includes('API_KEY')) {
          return 'Please configure your Google API key to use AI features. You can get one from Google AI Studio.'
        }

        return `I encountered an error: ${errorMessage}. Please try again.`
      } finally {
        setIsLoading(false)
      }
    },
    [initializeChat]
  )

  const clearHistory = useCallback(() => {
    if (chatSessionRef.current) {
      chatSessionRef.current.history = new InMemoryChatMessageHistory()
      // Re-add system message
      chatSessionRef.current.history.addMessage(
        new SystemMessage(
          `You are Clue, an AI assistant that helps users understand and interact with their screen content.`
        )
      )
    }
  }, [])

  const getMessageHistory = useCallback(async () => {
    if (chatSessionRef.current) {
      return await chatSessionRef.current.history.getMessages()
    }
    return []
  }, [])

  return {
    sendMessage,
    isLoading,
    error,
    clearHistory,
    getMessageHistory
  }
}
