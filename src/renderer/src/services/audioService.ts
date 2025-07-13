export class AudioService {
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private audioProcessor: ScriptProcessorNode | null = null
  private isCapturing = false
  private onAudioDataCallback: ((audioData: string) => void) | null = null

  // Audio configuration constants
  private static readonly SAMPLE_RATE = 24000
  private static readonly BUFFER_SIZE = 4096
  private static readonly AUDIO_CHUNK_DURATION = 0.1 // seconds

  constructor() {
    // System audio capture only - no microphone setup needed
  }

  /**
   * Set callback function to receive processed audio data
   */
  setAudioDataCallback(callback: ((audioData: string) => void) | null): void {
    this.onAudioDataCallback = callback
  }

  /**
   * Start capturing system audio
   */
  async startSystemAudioCapture(): Promise<void> {
    try {
      const platform = this.detectPlatform()
      console.log(`Starting system audio capture for platform: ${platform}`)

      // Use web API for system audio capture (Windows and Linux only)
      this.mediaStream = await this.getSystemAudioStream(platform)

      if (!this.mediaStream) {
        throw new Error('Failed to obtain system audio stream')
      }

      console.log('System audio stream obtained:', {
        hasAudio: this.mediaStream.getAudioTracks().length > 0,
        audioTrack: this.mediaStream.getAudioTracks()[0]?.getSettings()
      })

      // Setup audio processing using ScriptProcessorNode
      this.audioContext = new AudioContext({ sampleRate: AudioService.SAMPLE_RATE })
      this.setupAudioProcessing()
      this.isCapturing = true
    } catch (error) {
      console.error('Error starting system audio capture:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to start system audio capture: ${errorMessage}`)
    }
  }

  /**
   * Stop system audio capture
   */
  async stopSystemAudioCapture(): Promise<void> {
    console.log('Stopping system audio capture...')

    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    this.isCapturing = false
  }

  /**
   * Toggle system audio capture
   */
  async toggleSystemAudioCapture(): Promise<void> {
    if (this.isCapturing) {
      await this.stopSystemAudioCapture()
    } else {
      await this.startSystemAudioCapture()
    }
  }

  /**
   * Get current capture status
   */
  isSystemAudioCapturing(): boolean {
    return this.isCapturing
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): 'windows' | 'macos' | 'linux' {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) return 'windows'
    if (userAgent.includes('mac')) return 'macos'
    return 'linux'
  }

  /**
   * Get system audio stream based on platform
   */
  private async getSystemAudioStream(platform: string): Promise<MediaStream> {
    switch (platform) {
      case 'windows':
      case 'linux':
        try {
          // Use getDisplayMedia - Electron will handle the system audio via setDisplayMediaRequestHandler
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: 1,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: {
              sampleRate: AudioService.SAMPLE_RATE,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })

          // Check if we got audio tracks
          const audioTracks = stream.getAudioTracks()
          if (audioTracks.length === 0) {
            stream.getTracks().forEach((track) => track.stop())
            throw new Error('No audio track available. System audio capture may not be supported.')
          }

          console.log(
            'Audio tracks found:',
            audioTracks.length,
            'Audio settings:',
            audioTracks[0]?.getSettings()
          )

          // Create a new stream with only the audio track for processing
          const audioOnlyStream = new MediaStream()
          audioTracks.forEach((track) => audioOnlyStream.addTrack(track))

          // Stop video tracks since we don't need them for audio processing
          stream.getVideoTracks().forEach((track) => track.stop())

          return audioOnlyStream
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
              throw new Error(
                'Permission denied. Please allow screen sharing to capture system audio.'
              )
            } else if (error.name === 'NotSupportedError') {
              throw new Error(
                'System audio capture is not supported. Make sure you are using a compatible Electron version.'
              )
            } else if (error.name === 'NotFoundError') {
              throw new Error('No audio source found. Make sure system audio is playing.')
            } else {
              throw new Error(`System audio capture failed: ${error.message}`)
            }
          }
          throw error
        }

      case 'macos':
        throw new Error('macOS system audio capture is not supported in this version')

      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  /**
   * Setup audio processing pipeline using ScriptProcessorNode
   */
  private setupAudioProcessing(): void {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio context or media stream not available')
    }

    try {
      // Create script processor node
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.audioProcessor = this.audioContext.createScriptProcessor(AudioService.BUFFER_SIZE, 1, 1)

      let audioBuffer: number[] = []
      const samplesPerChunk = AudioService.SAMPLE_RATE * AudioService.AUDIO_CHUNK_DURATION

      this.audioProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        audioBuffer.push(...inputData)

        // Process audio in chunks
        while (audioBuffer.length >= samplesPerChunk) {
          const chunk = audioBuffer.splice(0, samplesPerChunk)
          const pcmData16 = this.convertFloat32ToInt16(new Float32Array(chunk))
          const base64Data = this.arrayBufferToBase64(pcmData16.buffer as ArrayBuffer)

          // Just log that we're receiving audio data, no processing to AI
          console.log('System audio data captured, length:', base64Data.length)

          // Optionally call callback if someone wants to handle raw audio data
          if (this.onAudioDataCallback) {
            this.onAudioDataCallback(base64Data)
          }
        }
      }

      source.connect(this.audioProcessor)
      this.audioProcessor.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Error setting up audio processor:', error)
      throw new Error(
        `Failed to setup audio processing: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Convert Float32Array to Int16Array for transmission
   */
  private convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      // Improved scaling to prevent clipping
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return int16Array
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Send audio data to AI service via Electron main process
   * THIS METHOD IS DISABLED - NO AI PROCESSING FOR NOW
   */
  async sendAudioData(_audioData: string): Promise<{ success: boolean; error?: string }> {
    // Disabled for now - no AI processing
    console.log('sendAudioData called but disabled - no AI processing')
    return { success: true, error: 'AI processing disabled' }
  }

  /**
   * Test if system audio capture is supported in this environment
   */
  async testSupport(): Promise<{ supported: boolean; error?: string; info: any }> {
    const info = {
      isSecureContext: window.isSecureContext,
      hasGetDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    }

    try {
      if (!window.isSecureContext) {
        return {
          supported: false,
          error: 'Requires HTTPS or localhost',
          info
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return {
          supported: false,
          error: 'getDisplayMedia not available',
          info
        }
      }

      return { supported: true, info }
    } catch (error) {
      return {
        supported: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        info
      }
    }
  }
}
