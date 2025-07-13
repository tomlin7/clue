export class AudioService {
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private audioWorkletNode: AudioWorkletNode | null = null
  private isCapturing = false
  private onAudioDataCallback: ((audioData: string) => void) | null = null

  // Audio configuration constants
  private static readonly SAMPLE_RATE = 24000

  constructor() {
    // System audio capture only - no microphone setup needed
  }

  /**
   * Set callback function to receive processed audio data
   */
  setAudioDataCallback(callback: (audioData: string) => void): void {
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

      // Setup audio processing using AudioWorkletNode
      this.audioContext = new AudioContext({ sampleRate: AudioService.SAMPLE_RATE })
      await this.setupAudioProcessing()
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

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect()
      this.audioWorkletNode.port.close()
      this.audioWorkletNode = null
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
              width: { ideal: 1 },
              height: { ideal: 1 },
              frameRate: { ideal: 1 }
            },
            audio: {
              echoCancellation: false, // Don't cancel system audio
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: AudioService.SAMPLE_RATE,
              channelCount: 1
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
   * Setup audio processing pipeline using AudioWorkletNode
   */
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio context or media stream not available')
    }

    try {
      // Load the audio worklet processor
      await this.audioContext.audioWorklet.addModule('/audioProcessor.js')

      // Create the audio worklet node
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'system-audio-processor')

      // Set up message handling for audio data
      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioData' && this.onAudioDataCallback) {
          this.onAudioDataCallback(event.data.data)
        }
      }

      // Connect audio pipeline
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      source.connect(this.audioWorkletNode)
      this.audioWorkletNode.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Error setting up audio worklet:', error)
      throw new Error(
        `Failed to setup audio processing: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Send audio data to AI service via Electron main process
   */
  async sendAudioData(audioData: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await window.electronAPI.audio.sendData(audioData)
    } catch (error) {
      console.error('Error sending audio data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
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
