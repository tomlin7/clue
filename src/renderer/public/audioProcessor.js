// audioProcessor.js - AudioWorkletProcessor for system audio capture
class SystemAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 4096
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
    this.sampleRate = 24000
    this.chunkDuration = 0.1 // seconds
    this.samplesPerChunk = this.sampleRate * this.chunkDuration
    this.audioBuffer = []
  }

  // Manual base64 encoding for AudioWorkletProcessor context
  arrayBufferToBase64(buffer) {
    const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const bytes = new Uint8Array(buffer)
    let result = ''

    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i]
      const b = bytes[i + 1] || 0
      const c = bytes[i + 2] || 0

      const bitmap = (a << 16) | (b << 8) | c

      result += base64chars.charAt((bitmap >> 18) & 63)
      result += base64chars.charAt((bitmap >> 12) & 63)
      result += i + 1 < bytes.length ? base64chars.charAt((bitmap >> 6) & 63) : '='
      result += i + 2 < bytes.length ? base64chars.charAt(bitmap & 63) : '='
    }

    return result
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (input.length > 0) {
      const inputChannel = input[0]

      // Copy input to output for passthrough
      if (output.length > 0) {
        output[0].set(inputChannel)
      }

      // Process audio data
      for (let i = 0; i < inputChannel.length; i++) {
        this.audioBuffer.push(inputChannel[i])

        // When we have enough samples for a chunk, send it
        if (this.audioBuffer.length >= this.samplesPerChunk) {
          const chunk = this.audioBuffer.splice(0, this.samplesPerChunk)

          // Convert Float32Array to Int16Array
          const int16Array = new Int16Array(chunk.length)
          for (let j = 0; j < chunk.length; j++) {
            const s = Math.max(-1, Math.min(1, chunk[j]))
            int16Array[j] = s < 0 ? s * 0x8000 : s * 0x7fff
          }

          // Convert to base64 using manual encoding
          const base64Data = this.arrayBufferToBase64(int16Array.buffer)

          // Send audio data via message port
          this.port.postMessage({
            type: 'audioData',
            data: base64Data
          })
        }
      }
    }

    return true // Keep processor alive
  }
}

registerProcessor('system-audio-processor', SystemAudioProcessor)
