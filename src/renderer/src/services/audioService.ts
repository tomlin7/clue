export class AudioService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false
  private recognition: any = null
  private currentTranscription = ''

  constructor() {
    this.setupSpeechRecognition()
  }

  private setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'

      this.recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          this.currentTranscription = finalTranscript
        }
      }

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
    }
  }

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      this.mediaRecorder = new MediaRecorder(this.stream)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
      this.isRecording = true

      // Start speech recognition
      if (this.recognition) {
        this.recognition.start()
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('Failed to start recording')
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob())
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
      this.isRecording = false

      // Stop speech recognition
      if (this.recognition) {
        this.recognition.stop()
      }
    })
  }

  toggleRecording(): Promise<Blob | void> {
    if (this.isRecording) {
      return this.stopRecording()
    } else {
      return this.startRecording()
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
  }

  getCurrentTranscription(): string {
    return this.currentTranscription
  }

  clearTranscription(): void {
    this.currentTranscription = ''
  }

  getIsRecording(): boolean {
    return this.isRecording
  }
}
