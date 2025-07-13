import { ipcMain, IpcMainInvokeEvent } from 'electron'

/**
 * Setup IPC handlers for audio capture
 */
export function setupAudioIpcHandlers(): void {
  // Send audio data to AI service - DISABLED FOR NOW
  ipcMain.handle(
    'audio:send-data',
    async (
      _event: IpcMainInvokeEvent,
      audioData: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // DISABLED: No AI processing for now, just log that we received data
        console.log('Received audio data (AI processing disabled):', audioData.length, 'characters')

        // DISABLED: Don't send to renderer or AI service
        // sendAudioDataToRenderer(audioData)
        // TODO: Send to AI service (Gemini, etc.) - DISABLED

        return { success: true, error: 'AI processing disabled' }
      } catch (error) {
        console.error('Error in audio handler:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: errorMessage }
      }
    }
  )
}

/**
 * Cleanup audio resources on app quit
 */
export async function cleanupAudio(): Promise<void> {
  // No cleanup needed for web-based audio capture
  console.log('Audio cleanup completed')
}
