import { GoogleGenAI } from '@google/genai'

export interface LiveSessionConfig {
  apiKey: string
  language?: string
  screenshotInterval: number
  screenshotQuality: 'low' | 'medium' | 'high'
  interviewPrompt?: string // prompt from selected interview profile
  resumeAnalysis?: string // summary of resume for user context
}

export interface LiveSessionCallbacks {
  onSessionUpdate: (status: string) => void
  onTranscription: (text: string) => void
  onResponse: (text: string) => void
  onError: (error: string) => void
  onClose: (reason: string) => void
}

export class LiveAIService {
  private client: GoogleGenAI | null = null
  private session: any = null
  private callbacks: LiveSessionCallbacks | null = null
  private currentTranscription = ''
  private messageBuffer = ''
  private conversationHistory: Array<{
    timestamp: number
    transcription: string
    ai_response: string
  }> = []
  private isInitializing = false
  private screenshotInterval: NodeJS.Timeout | null = null
  private currentSessionId: string | null = null

  // Reconnection management
  private reconnectionAttempts = 0
  private maxReconnectionAttempts = 3
  private reconnectionDelay = 2000
  private lastSessionParams: LiveSessionConfig | null = null

  constructor() {
    this.initializeNewSession()
  }

  private initializeNewSession() {
    this.currentSessionId = Date.now().toString()
    this.currentTranscription = ''
    this.conversationHistory = []
    console.log('New live session initialized:', this.currentSessionId)
  }

  private saveConversationTurn(transcription: string, aiResponse: string) {
    if (!this.currentSessionId) {
      this.initializeNewSession()
    }

    const conversationTurn = {
      timestamp: Date.now(),
      transcription: transcription.trim(),
      ai_response: aiResponse
    }

    this.conversationHistory.push(conversationTurn)
    console.log('Saved conversation turn:', conversationTurn)

    // Notify main process to save conversation
    if (window.electronAPI?.saveConversationTurn && this.currentSessionId) {
      window.electronAPI.saveConversationTurn({
        sessionId: this.currentSessionId,
        turn: conversationTurn,
        fullHistory: this.conversationHistory
      })
    }
  }

  private async sendReconnectionContext() {
    if (!this.session || this.conversationHistory.length === 0) {
      return
    }

    try {
      const transcriptions = this.conversationHistory
        .map((turn) => turn.transcription)
        .filter((transcription) => transcription && transcription.trim().length > 0)

      if (transcriptions.length === 0) {
        return
      }

      const contextMessage = `Till now all these questions were asked in the interview, answer the last one please:\n\n${transcriptions.join('\n')}`

      console.log('Sending reconnection context with', transcriptions.length, 'previous questions')

      await this.session.sendRealtimeInput({
        text: contextMessage
      })
    } catch (error) {
      console.error('Error sending reconnection context:', error)
    }
  }

  private async attemptReconnection(): Promise<boolean> {
    if (!this.lastSessionParams || this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.log('Max reconnection attempts reached or no session params stored')
      this.callbacks?.onSessionUpdate('Session closed')
      return false
    }

    this.reconnectionAttempts++
    console.log(
      `Attempting reconnection ${this.reconnectionAttempts}/${this.maxReconnectionAttempts}...`
    )

    await new Promise((resolve) => setTimeout(resolve, this.reconnectionDelay))

    try {
      const success = await this.initializeSession(this.lastSessionParams, true)
      if (success) {
        this.reconnectionAttempts = 0
        console.log('Live session reconnected')
        await this.sendReconnectionContext()
        return true
      }
    } catch (error) {
      console.error(`Reconnection attempt ${this.reconnectionAttempts} failed:`, error)
    }

    if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      return this.attemptReconnection()
    } else {
      console.log('All reconnection attempts failed')
      this.callbacks?.onSessionUpdate('Session closed')
      return false
    }
  }

  private getSystemPrompt(profilePrompt?: string, resumeAnalysis?: string): string {
    const base = `You are an AI-powered ${(profilePrompt ?? 'interview assistant').trim()}, serving as a discreet on-screen teleprompter. Your goal is to help the user succeed in job interviews by providing short, impactful, and ready-to-speak answers or talking points. Always analyze the ongoing interview and the 'User-provided context' below.

**IMPORTANT RULES:**
- **Never repeat, rephrase, or paraphrase the interviewer's question or transcription.**
- **Only provide a direct answer as if you are the candidate.**
- Do not echo or reference the question in your response.
- ALWAYS USE **MARKDOWN** for formatting. 
- ALWAYS be specific, detailed, and accurate.
- ALWAYS acknowledge uncertainty when present.
- ALWAYS use markdown formatting.
- After completing a set of bullet points, always add three trailing newline characters unescaped

**RESPONSE FORMAT:**
- Limit answers to 1-3 sentences
- Use **markdown** for clarity
- Highlight key points with **bold**
- Use bullet points (-) for lists
- Only include the most essential information

**REAL-TIME INFO:**
- If asked about **recent news, events, or trends** (last 6 months), **use Google search** for up-to-date info
- For **company-specific details** (acquisitions, funding, leadership), search Google first
- For **new tech, frameworks, or industry changes**, search for the latest updates
- After searching, give a concise, informed answer based on current data

**TAILORING:**
- Rely heavily on the 'User-provided context' (industry, job description, resume, skills, achievements)
- Make every response highly relevant to the user's field and the specific role

**EXAMPLES:**

Interviewer: "Tell me about yourself"  
You: "I'm a software engineer with 5 years' experience in scalable web apps, specializing in React and Node.js. I've led teams at two startups and love solving complex technical challenges."

Interviewer: "What's your experience with React?"  
You: "4 years building everything from landing pages to dashboards. Skilled with hooks, context API, performance tuning, and custom component libraries."

Interviewer: "Why do you want to work here?"  
You: "Your company's fintech solutions align with my passion for impactful products. I'm excited by your tech stack and eager to contribute to your microservices architecture."

User-provided context
-----
${resumeAnalysis || 'Proceed without any user context.'}

**OUTPUT:**  
Only provide the exact words to say, in **markdown**. No coaching, no explanations—just direct, short, and impactful responses.`

    return base
  }

  async initializeSession(
    config: LiveSessionConfig & { tools?: string[]; interviewPrompt?: string },
    isReconnection = false
  ): Promise<boolean> {
    if (this.isInitializing) {
      console.log('Session initialization already in progress')
      return false
    }

    this.isInitializing = true
    this.callbacks?.onSessionUpdate('Initializing session...')

    if (!isReconnection) {
      this.lastSessionParams = config
      this.reconnectionAttempts = 0
    }

    this.client = new GoogleGenAI({
      vertexai: false,
      apiKey: config.apiKey
    })

    const systemPrompt = this.getSystemPrompt(config.interviewPrompt, config.resumeAnalysis)

    if (!isReconnection) {
      this.initializeNewSession()
    }

    try {
      // If tools are enabled, pass them to the config (object form for Google Search)
      const tools =
        config.tools && config.tools.includes('google-search') ? [{ googleSearch: {} }] : []
      this.session = await this.client.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('✅ Live session connected successfully')
            this.callbacks?.onSessionUpdate('Live session connected')
          },
          onmessage: (message: any) => {
            console.log('📨 Live session message:', message)

            // Handle transcription input
            if (message.serverContent?.inputTranscription?.text) {
              this.currentTranscription += message.serverContent.inputTranscription.text
              console.log('📝 Transcription update:', this.currentTranscription)
              this.callbacks?.onTranscription(this.currentTranscription)
            }

            // Handle AI model response
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                  if (
                    this.messageBuffer.length > 0 &&
                    this.messageBuffer[this.messageBuffer.length - 1] === '.'
                  ) {
                    this.messageBuffer += ' ' + part.text
                  } else {
                    this.messageBuffer += part.text
                  }
                  console.log('🤖 AI response chunk:', part.text)
                  this.callbacks?.onResponse(this.messageBuffer)
                }
              }
            }

            if (message.serverContent?.generationComplete) {
              this.callbacks?.onResponse(this.messageBuffer)

              // Save conversation turn when we have both transcription and AI response
              if (this.currentTranscription && this.messageBuffer) {
                this.saveConversationTurn(this.currentTranscription, this.messageBuffer)
                this.currentTranscription = ''
              }

              this.messageBuffer = ''
            }

            if (message.serverContent?.turnComplete) {
              this.callbacks?.onSessionUpdate('Listening...')
            }
          },
          onerror: (error: any) => {
            console.error('Live session error:', error.message)

            const isApiKeyError =
              error.message &&
              (error.message.includes('API key not valid') ||
                error.message.includes('invalid API key') ||
                error.message.includes('authentication failed') ||
                error.message.includes('unauthorized'))

            if (isApiKeyError) {
              console.log('Error due to invalid API key - stopping reconnection attempts')
              this.lastSessionParams = null
              this.reconnectionAttempts = this.maxReconnectionAttempts
              this.callbacks?.onError('Invalid API key')
              return
            }

            this.callbacks?.onError(error.message)
          },
          onclose: (event: any) => {
            console.log('Live session closed:', event.reason)

            const isApiKeyError =
              event.reason &&
              (event.reason.includes('API key not valid') ||
                event.reason.includes('invalid API key') ||
                event.reason.includes('authentication failed') ||
                event.reason.includes('unauthorized'))

            if (isApiKeyError) {
              console.log('Session closed due to invalid API key')
              this.lastSessionParams = null
              this.reconnectionAttempts = this.maxReconnectionAttempts
              this.callbacks?.onClose('Session closed: Invalid API key')
              return
            }

            // Attempt automatic reconnection for server-side closures
            if (
              this.lastSessionParams &&
              this.reconnectionAttempts < this.maxReconnectionAttempts
            ) {
              console.log('Attempting automatic reconnection...')
              this.attemptReconnection()
            } else {
              this.callbacks?.onClose('Session closed')
            }
          }
        },
        config: {
          responseModalities: ['TEXT'] as any,
          tools,
          inputAudioTranscription: {},
          contextWindowCompression: { slidingWindow: {} },
          speechConfig: { languageCode: config.language || 'en-US' },
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        }
      })

      this.isInitializing = false
      return true
    } catch (error) {
      console.error('Failed to initialize live session:', error)
      this.isInitializing = false
      this.callbacks?.onError(`Failed to initialize session: ${error}`)
      return false
    }
  }

  setCallbacks(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks
  }

  async sendAudioData(audioData: string, mimeType: string) {
    if (!this.session) {
      console.warn('❌ No active session to send audio data')
      return
    }

    try {
      console.log('🎵 Sending audio data, size:', audioData.length, 'mimeType:', mimeType)

      // Send audio
      await this.session.sendRealtimeInput({
        audio: {
          data: audioData,
          mimeType: mimeType
        }
      })

      console.log('✅ Audio data sent successfully')
    } catch (error) {
      console.error('❌ Error sending audio data:', error)
      this.callbacks?.onError(`Error sending audio: ${error}`)
    }
  }

  async sendScreenshot(imageData: string) {
    if (!this.session) {
      console.warn('❌ No active session to send screenshot')
      return
    }

    try {
      console.log('📸 Sending screenshot, size:', imageData.length)

      // Send image
      await this.session.sendRealtimeInput({
        media: {
          data: imageData,
          mimeType: 'image/jpeg'
        }
      })

      console.log('✅ Screenshot sent successfully')
    } catch (error) {
      console.error('❌ Error sending screenshot:', error)
      this.callbacks?.onError(`Error sending screenshot: ${error}`)
    }
  }

  async sendTextInput(text: string) {
    if (!this.session) {
      console.warn('❌ No active session to send text')
      return
    }

    try {
      console.log('📝 Sending text input:', text)
      await this.session.sendRealtimeInput({
        text: text
      })
      console.log('✅ Text input sent successfully')
    } catch (error) {
      console.error('❌ Error sending text input:', error)
      this.callbacks?.onError(`Error sending text: ${error}`)
    }
  }

  startScreenshotCapture(interval: number, quality: 'low' | 'medium' | 'high') {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval)
    }

    if (interval === 0) {
      console.log('Manual screenshot mode enabled')
      return
    }

    const intervalMs = interval * 1000
    this.screenshotInterval = setInterval(async () => {
      await this.captureAndSendScreenshot(quality)
    }, intervalMs)

    // Capture first screenshot immediately
    setTimeout(() => this.captureAndSendScreenshot(quality), 100)
  }

  private async captureAndSendScreenshot(quality: 'low' | 'medium' | 'high') {
    try {
      console.log('📸 Capturing screenshot with quality:', quality)
      const screenshot = await window.electronAPI?.captureScreen?.(quality)
      if (screenshot) {
        console.log('📸 Screenshot captured, sending to AI...')
        await this.sendScreenshot(screenshot)
      } else {
        console.warn('❌ No screenshot data received')
      }
    } catch (error) {
      console.error('❌ Error capturing screenshot:', error)
    }
  }

  stopScreenshotCapture() {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval)
      this.screenshotInterval = null
    }
  }

  async stop() {
    this.stopScreenshotCapture()

    if (this.session) {
      try {
        await this.session.disconnect()
      } catch (error) {
        console.error('Error disconnecting session:', error)
      }
      this.session = null
    }

    this.client = null
    this.callbacks = null
    this.lastSessionParams = null
    this.reconnectionAttempts = 0
  }

  isConnected(): boolean {
    return this.session !== null
  }

  getCurrentSessionData() {
    return {
      sessionId: this.currentSessionId,
      history: this.conversationHistory
    }
  }
}
