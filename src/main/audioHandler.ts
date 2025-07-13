import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron'

/**
 * Send audio data to renderer process
 */
function sendAudioDataToRenderer(audioData: string): void {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0) {
    windows[0].webContents.send('audio-data-received', audioData)
  }
}

/**
 * Setup IPC handlers for audio capture
 */
export function setupAudioIpcHandlers(): void {
  // Send audio data to AI service
  ipcMain.handle(
    'audio:send-data',
    async (
      _event: IpcMainInvokeEvent,
      audioData: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Here you would integrate with your AI service
        // For now, we'll just log that we received the data
        console.log('Received audio data:', audioData.length, 'characters')

        // Also send to renderer process for real-time processing
        sendAudioDataToRenderer(audioData)

        // TODO: Send to AI service (Gemini, etc.)

        return { success: true }
      } catch (error) {
        console.error('Error sending audio data:', error)
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
