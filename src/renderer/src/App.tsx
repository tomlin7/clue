import { useState, useEffect, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useAIChat } from './hooks/useAIChat';
import './styles/globals.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  screenshot?: string;
}

function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [isAudioCapture, setIsAudioCapture] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoiceRecognition();

  const {
    sendMessage,
    isLoading,
  } = useAIChat();

  // Handle Electron IPC events
  useEffect(() => {
    if (window.electronAPI) {
      // Get initial panel position
      window.electronAPI.getPanelPosition().then(setPanelPosition);

      // Listen for events from main process
      window.electronAPI.onToggleVisibility(setIsVisible);
      window.electronAPI.onUpdatePanelPosition(setPanelPosition);
      window.electronAPI.onCaptureAndSend(handleCaptureAndSend);
      window.electronAPI.onToggleTranscription(handleToggleTranscription);
    }
  }, []);

  const handlePanelInteractionStart = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.panelInteractionStart();
    }
  }, []);

  const handlePanelInteractionEnd = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.panelInteractionEnd();
    }
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleToggleTranscription = useCallback(() => {
    handleToggleRecording();
  }, [handleToggleRecording]);

  const handleToggleAudioCapture = useCallback(() => {
    setIsAudioCapture(prev => !prev);
  }, []);

  const handleCapture = useCallback(async () => {
    if (window.electronAPI) {
      const screenshot = await window.electronAPI.captureScreen();
      await handleCaptureAndSend(screenshot || undefined);
    }
  }, []);

  const handleCaptureAndSend = useCallback(async (screenshot?: string) => {
    try {
      let screenshotData = screenshot;
      if (!screenshotData && window.electronAPI) {
        screenshotData = (await window.electronAPI.captureScreen()) || undefined;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: transcript || 'Analyze this screen',
        timestamp: new Date(),
        screenshot: screenshotData || undefined,
      };

      setMessages(prev => [...prev, userMessage]);

      // Clear transcript after using it
      clearTranscript();

      // Send to AI
      const response = await sendMessage(
        userMessage.content,
        screenshotData || undefined
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in capture and send:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [transcript, sendMessage, clearTranscript]);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ControlPanel
        isVisible={isVisible}
        position={panelPosition}
        onPanelInteractionStart={handlePanelInteractionStart}
        onPanelInteractionEnd={handlePanelInteractionEnd}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        isAudioCapture={isAudioCapture}
        onToggleAudioCapture={handleToggleAudioCapture}
        onCapture={handleCapture}
      />
      
      <ResponsePanel
        isVisible={isVisible}
        position={panelPosition}
        onPanelInteractionStart={handlePanelInteractionStart}
        onPanelInteractionEnd={handlePanelInteractionEnd}
        messages={messages}
        isLoading={isLoading}
        onClearMessages={handleClearMessages}
      />
    </div>
  );
}

export default App;

