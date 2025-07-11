# Clue - AI-Powered Screen Analysis Tool

A sleek, transparent overlay application that provides AI-powered analysis of your screen content with voice transcription support.

## Features

- 🖥️ **Screen Capture & Analysis**: Capture screenshots and get AI insights
- 🎤 **Voice Recognition**: Record audio and get transcriptions
- 🎨 **Theme Support**: Light, dark, and system themes
- ⚙️ **Customizable Settings**: Adjust opacity, prompts, and preferences
- 🔄 **Follow-up Questions**: Continue conversations with the AI
- ⌨️ **Global Shortcuts**: Control the app from anywhere
- 🪟 **Frameless Design**: Clean, minimalist transparent overlay

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd clue-ev
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Google AI API key:
     ```
     VITE_GOOGLE_API_KEY=your-google-api-key-here
     ```

4. **Development**

   ```bash
   npm run dev
   ```

5. **Build**
   ```bash
   npm run build
   ```

## Keyboard Shortcuts

- **Ctrl+\\** - Show/Hide application
- **Ctrl+Enter** - Capture screen and analyze
- **Ctrl+M** - Toggle microphone recording
- **Ctrl+T** - Cycle through themes (light/dark/system)
- **Ctrl+Q** - Close application
- **Ctrl+Arrow Keys** - Move panels around the screen

## Usage

1. **Launch the app** - It will appear as a transparent overlay
2. **Position panels** - Use arrow keys with Ctrl to move panels
3. **Capture & Analyze** - Press Ctrl+Enter to capture screen and get AI analysis
4. **Voice Input** - Click the microphone or press Ctrl+M to record audio
5. **Follow-up Questions** - Type questions in the response panel for continued conversation
6. **Settings** - Click the settings icon to customize the app
7. **Hide when needed** - Press Ctrl+\\ to hide/show the overlay

## Configuration

### Settings Panel

- **Theme**: Switch between light, dark, and system themes
- **Opacity**: Adjust panel transparency (10-100%)
- **Default Prompt**: Customize the AI analysis prompt
- **AI Model**: Choose between available models

### Environment Variables

- `VITE_GOOGLE_API_KEY` - Your Google AI API key (required)
- `VITE_DEFAULT_OPACITY` - Default panel opacity (optional)
- `VITE_DEFAULT_POSITION_X` - Default X position (optional)
- `VITE_DEFAULT_POSITION_Y` - Default Y position (optional)

## Technology Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **LangChain** - AI integration
- **Google Generative AI** - AI model provider

## Development

### Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Electron preload scripts
└── renderer/       # React frontend
    ├── components/ # UI components
    ├── contexts/   # React contexts
    ├── hooks/      # Custom hooks
    ├── services/   # Service classes
    └── styles/     # Style files
```

### Building for Production

```bash
# Build for current platform
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]
