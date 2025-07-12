import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface AIMode {
  id: string
  name: string
  icon: string
  prompt: string
  category?: string
  isCustom?: boolean
}

export interface AppConfig {
  opacity: number
  aiModel: string
  theme: 'light' | 'dark' | 'system'
  position: { x: number; y: number }
  selectedModeId: string
  modes: AIMode[]
  apiKey: string
}

const defaultModes: AIMode[] = [
  {
    id: 'focus',
    name: 'Focus',
    icon: '🎯',
    prompt: `Help me focus on what's important on this screen.

Identify:
• The 3 most critical items requiring attention
• Next actionable steps I should take
• Potential distractions to ignore
• Priority tasks or deadlines
• Key information I shouldn't miss`,
    category: 'productivity'
  },
  {
    id: 'explain',
    name: 'Explain',
    icon: '⚡',
    prompt: `Explain what I'm looking at in simple terms.

Break down:
• What this application/website does
• How to use the interface effectively
• What each section or feature is for
• Common workflows and processes
• Tips for getting things done faster`,
    category: 'help'
  },
  {
    id: 'suggest',
    name: 'Suggest',
    icon: '➕',
    prompt: `Give me practical suggestions and improvements.

Recommend:
• Better ways to organize or use this interface
• Shortcuts or efficiency improvements
• Missing features that would help
• Alternative approaches or tools
• Workflow optimizations I could implement`,
    category: 'improvement'
  },
  {
    id: 'help',
    name: 'Help',
    icon: '❓',
    prompt: `I need help understanding or fixing something.

Assist with:
• Troubleshooting any visible issues
• Step-by-step guidance for tasks
• Explaining error messages or warnings
• Finding specific features or settings
• Recovering from problems or mistakes`,
    category: 'support'
  },
  {
    id: 'note',
    name: 'Note',
    icon: '📝',
    prompt: `Create useful notes and documentation from what's shown.

Generate:
• Key points and takeaways summary
• Action items and follow-up tasks
• Important details worth remembering
• Meeting notes or discussion points
• Reference documentation for later use`,
    category: 'productivity'
  },
  {
    id: 'interview',
    name: 'Interview',
    icon: '🎤',
    prompt: `Help me conduct or participate in an interview or meeting.

Support with:
• Preparing thoughtful questions to ask
• Identifying key discussion topics
• Summarizing conversation points
• Suggesting follow-up questions
• Tracking important responses and insights`,
    category: 'communication'
  },
  {
    id: 'learn',
    name: 'Learn',
    icon: '📚',
    prompt: `Help me learn and understand new concepts.

Explain:
• How things work and why
• Connections to concepts I already know
• Best practices and common patterns
• Learning resources and next steps
• Practical exercises to try`,
    category: 'education'
  },
  {
    id: 'quick',
    name: 'Quick',
    icon: '⚡',
    prompt: `Give me a quick, actionable summary.

Provide:
• 30-second overview of what I'm seeing
• Immediate next step to take
• Most important thing to focus on right now
• Quick win or easy improvement
• Fast solution to any obvious problem`,
    category: 'efficiency'
  },
  {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    prompt: `Review the visual design and user experience.

Evaluate:
• Visual appeal and professional appearance
• Ease of use and intuitive navigation
• Accessibility and readability
• Brand consistency and style
• Suggestions for visual improvements`,
    category: 'design'
  },
  {
    id: 'debug',
    name: 'Debug',
    icon: '🔧',
    prompt: `Help me identify and fix technical problems.

Look for:
• Error messages or broken functionality
• Performance issues or slow loading
• Code problems or implementation issues
• Configuration or setup problems
• Missing dependencies or resources`,
    category: 'technical'
  }
]

const defaultConfig: AppConfig = {
  opacity: 100,
  aiModel: 'gemini-2.0-flash',
  theme: 'system',
  position: { x: 100, y: 100 },
  selectedModeId: 'focus',
  modes: defaultModes,
  apiKey: ''
}

class ConfigManager {
  private configPath: string
  private config: AppConfig
  private watchers: ((config: AppConfig) => void)[] = []

  constructor() {
    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, 'config.json')
    this.config = this.loadConfig()
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8')
        const parsed = JSON.parse(configData)

        // Merge with defaults to ensure all properties exist
        const merged = {
          ...defaultConfig,
          ...parsed,
          modes: [...defaultModes, ...(parsed.customModes || [])]
        }

        return merged
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }

    return { ...defaultConfig }
  }

  private saveConfig(): void {
    try {
      // Separate default and custom modes for storage
      const defaultModeIds = defaultModes.map((m) => m.id)
      const customModes = this.config.modes.filter((m) => !defaultModeIds.includes(m.id))

      const configToSave = {
        ...this.config,
        customModes,
        modes: undefined // Don't save default modes
      }

      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2))

      // Notify watchers
      this.watchers.forEach((watcher) => watcher(this.config))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getConfig(): AppConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
  }

  addMode(mode: Omit<AIMode, 'id'> & { id?: string }): string {
    const id = mode.id || `custom_${Date.now()}`
    const newMode: AIMode = {
      ...mode,
      id,
      isCustom: true
    }

    this.config.modes.push(newMode)
    this.saveConfig()
    return id
  }

  updateMode(id: string, updates: Partial<Omit<AIMode, 'id'>>): void {
    const modeIndex = this.config.modes.findIndex((m) => m.id === id)
    if (modeIndex >= 0) {
      this.config.modes[modeIndex] = { ...this.config.modes[modeIndex], ...updates }
      this.saveConfig()
    }
  }

  deleteMode(id: string): void {
    // Don't allow deletion of default modes
    const defaultModeIds = defaultModes.map((m) => m.id)
    if (!defaultModeIds.includes(id)) {
      this.config.modes = this.config.modes.filter((m) => m.id !== id)
      // If deleted mode was selected, switch to focus mode
      if (this.config.selectedModeId === id) {
        this.config.selectedModeId = 'focus'
      }
      this.saveConfig()
    }
  }

  getSelectedMode(): AIMode | undefined {
    return this.config.modes.find((m) => m.id === this.config.selectedModeId)
  }

  selectMode(id: string): void {
    if (this.config.modes.find((m) => m.id === id)) {
      this.config.selectedModeId = id
      this.saveConfig()
    }
  }

  resetToDefaults(): void {
    this.config = { ...defaultConfig }
    this.saveConfig()
  }

  onConfigChange(callback: (config: AppConfig) => void): () => void {
    this.watchers.push(callback)
    return () => {
      const index = this.watchers.indexOf(callback)
      if (index >= 0) {
        this.watchers.splice(index, 1)
      }
    }
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey
    this.saveConfig()
  }

  getApiKey(): string {
    return this.config.apiKey
  }

  hasValidApiKey(): boolean {
    return this.config.apiKey.length > 0
  }

  clearApiKey(): void {
    this.config.apiKey = ''
    this.saveConfig()
  }

  getConfigPath(): string {
    return this.configPath
  }

  openConfigFile(): void {
    const { shell } = require('electron')
    shell.openPath(this.configPath)
  }

  openConfigFolder(): void {
    const { shell } = require('electron')
    const configDir = require('path').dirname(this.configPath)
    shell.openPath(configDir)
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  importConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson)
      this.config = { ...defaultConfig, ...imported }
      this.saveConfig()
      return true
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }
}

export const configManager = new ConfigManager()
