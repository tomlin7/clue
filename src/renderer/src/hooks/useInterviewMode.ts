import { useConfig } from '@/contexts/ConfigContext'
import { LiveAIService, LiveSessionCallbacks, LiveSessionConfig } from '@/services/liveAIService'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface InterviewModeState {
  isActive: boolean
  status: string
  isInitializing: boolean
  transcription: string
  response: string
  error: string | null
  sessionData: any
}

export function useInterviewMode() {
  const { config } = useConfig()
  const [state, setState] = useState<InterviewModeState>({
    isActive: false,
    status: 'Inactive',
    isInitializing: false,
    transcription: '',
    response: '',
    error: null,
    sessionData: null
  })

  const liveServiceRef = useRef<LiveAIService | null>(null)
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Initialize live service callbacks
  const callbacks: LiveSessionCallbacks = {
    onSessionUpdate: (status: string) => {
      setState((prev) => ({ ...prev, status }))
    },
    onTranscription: (text: string) => {
      setState((prev) => ({ ...prev, transcription: text }))
    },
    onResponse: (text: string) => {
      setState((prev) => ({ ...prev, response: text }))
    },
    onError: (error: string) => {
      setState((prev) => ({ ...prev, error, status: 'Error' }))
    },
    onClose: (reason: string) => {
      setState((prev) => ({ ...prev, status: reason, isActive: false }))
      stopInterviewMode()
    }
  }

  const setupAudioCapture = useCallback(async () => {
    try {
      console.log('Setting up audio capture...')

      // Request display media with system audio
      console.log('🎤 Requesting display media with system audio...')
      console.log('📢 IMPORTANT: Please select "Share system audio" in the popup!')

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 24000,
          sampleSize: 16
        } as any
      })

      console.log('Display media obtained:', displayStream)
      console.log('Audio tracks:', displayStream.getAudioTracks())
      console.log('Video tracks:', displayStream.getVideoTracks())

      // Check if we have audio tracks
      if (displayStream.getAudioTracks().length === 0) {
        throw new Error(
          'No audio tracks found. Please make sure to enable "Share system audio" when prompted.'
        )
      }

      console.log('✅ Audio tracks found:', displayStream.getAudioTracks().length)

      mediaStreamRef.current = displayStream

      // Setup audio processing exactly
      const audioContext = new AudioContext({ sampleRate: 24000 })
      const source = audioContext.createMediaStreamSource(displayStream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      console.log('Audio context created, sample rate:', audioContext.sampleRate)

      let audioBuffer: number[] = []
      const samplesPerChunk = 24000 * 0.1 // 0.1 seconds

      processor.onaudioprocess = async (e) => {
        if (!liveServiceRef.current?.isConnected()) {
          console.warn('No live session connected, skipping audio processing')
          return
        }

        const inputData = e.inputBuffer.getChannelData(0)

        // Debug: Check if we're getting audio data
        const hasAudio = inputData.some((sample) => Math.abs(sample) > 0.001)
        if (hasAudio) {
          console.log(
            '🎵 Audio detected, RMS:',
            Math.sqrt(
              inputData.reduce((sum, sample) => sum + sample * sample, 0) / inputData.length
            )
          )
        }

        audioBuffer.push(...inputData)

        // Process audio in chunks
        while (audioBuffer.length >= samplesPerChunk) {
          const chunk = audioBuffer.splice(0, samplesPerChunk)

          // Convert Float32 to Int16
          const int16Array = new Int16Array(chunk.length)
          for (let i = 0; i < chunk.length; i++) {
            const s = Math.max(-1, Math.min(1, chunk[i]))
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
          }

          // Convert to base64
          let binary = ''
          const bytes = new Uint8Array(int16Array.buffer)
          const len = bytes.byteLength
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64Data = btoa(binary)

          // Send to live service
          console.log('Sending audio chunk, size:', base64Data.length)
          await liveServiceRef.current.sendAudioData(base64Data, 'audio/pcm;rate=24000')
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      audioContextRef.current = audioContext
      audioProcessorRef.current = processor

      console.log('Audio capture setup complete')
    } catch (error) {
      console.error('Error setting up audio capture:', error)
      setState((prev) => ({ ...prev, error: `Audio setup failed: ${error}` }))
    }
  }, [])

  const startInterviewMode = useCallback(async () => {
    if (!config.apiKey) {
      setState((prev) => ({ ...prev, error: 'API key is required' }))
      return
    }

    setState((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
      transcription: '',
      response: ''
    }))

    try {
      // Initialize live service
      liveServiceRef.current = new LiveAIService()
      liveServiceRef.current.setCallbacks(callbacks)

      // Get the selected interview profile's prompt
      const selectedProfile = config.interviewProfiles.find(
        (p) => p.id === config.selectedInterviewProfileId
      )
      const interviewPrompt = selectedProfile?.prompt || ''

      const sessionConfig: LiveSessionConfig & { tools?: string[]; interviewPrompt?: string } = {
        apiKey: config.apiKey,
        language: config.interviewMode?.language || 'en-US',
        screenshotInterval: config.interviewMode?.screenshotInterval || 5,
        screenshotQuality: config.interviewMode?.screenshotQuality || 'medium',
        tools: config.tools || [],
        interviewPrompt,
        resumeAnalysis: config.resumeAnalysis
      }

      console.log('Starting interview mode with config:', sessionConfig)

      const success = await liveServiceRef.current.initializeSession(sessionConfig)

      if (success) {
        // Setup audio capture
        await setupAudioCapture()

        // Start screenshot capture
        liveServiceRef.current.startScreenshotCapture(
          config.interviewMode?.screenshotInterval || 5,
          config.interviewMode?.screenshotQuality || 'medium'
        )

        setState((prev) => ({
          ...prev,
          isActive: true,
          isInitializing: false,
          status: 'Connected - Listening...'
        }))

        console.log('Interview mode started successfully')
      } else {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          error: 'Failed to initialize live session'
        }))
      }
    } catch (error) {
      console.error('Error starting interview mode:', error)
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: `Failed to start: ${error}`
      }))
    }
  }, [config, callbacks, setupAudioCapture])

  const stopInterviewMode = useCallback(async () => {
    // Stop audio processing
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect()
      audioProcessorRef.current = null
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    // Stop live service
    if (liveServiceRef.current) {
      await liveServiceRef.current.stop()
      liveServiceRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      status: 'Inactive',
      isInitializing: false,
      transcription: '',
      response: '',
      error: null
    }))
  }, [])

  const sendManualScreenshot = useCallback(async () => {
    if (!liveServiceRef.current?.isConnected()) {
      console.warn('No active live session for manual screenshot')
      return
    }

    try {
      const screenshot = await window.electronAPI.captureScreen(
        config.interviewMode?.screenshotQuality || 'medium'
      )
      await liveServiceRef.current.sendScreenshot(screenshot)
    } catch (error) {
      console.error('Error sending manual screenshot:', error)
      setState((prev) => ({ ...prev, error: `Screenshot failed: ${error}` }))
    }
  }, [config.interviewMode?.screenshotQuality])

  const sendTextInput = useCallback(async (text: string) => {
    if (!liveServiceRef.current?.isConnected()) {
      console.warn('No active live session for text input')
      return
    }

    try {
      await liveServiceRef.current.sendTextInput(text)
    } catch (error) {
      console.error('Error sending text input:', error)
      setState((prev) => ({ ...prev, error: `Text input failed: ${error}` }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const getCurrentSessionData = useCallback(() => {
    if (liveServiceRef.current) {
      return liveServiceRef.current.getCurrentSessionData()
    }
    return null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopInterviewMode()
    }
  }, [stopInterviewMode])

  return {
    state,
    startInterviewMode,
    stopInterviewMode,
    sendManualScreenshot,
    sendTextInput,
    clearError,
    getCurrentSessionData
  }
}
