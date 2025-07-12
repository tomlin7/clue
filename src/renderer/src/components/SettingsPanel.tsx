import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Moon, Palette, RotateCcw, Sun, X } from 'lucide-react'
import React from 'react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, className }) => {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { theme, setTheme, effectiveTheme } = useTheme()

  if (!isOpen) return null

  const handleOpacityChange = (value: string) => {
    const opacity = Math.max(10, Math.min(100, parseInt(value) || 80))
    updateSettings({ opacity })
  }

  const handleThemeToggle = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={16} />
      case 'dark':
        return <Moon size={16} />
      case 'system':
        return <Palette size={16} />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  return (
    <div
      className={cn(
        'acrylic-panel',
        'rounded-lg transition-all duration-200',
        'min-w-[400px] max-w-[500px]',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b border-zinc-500/10')}>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/30 text-zinc-700'
            )}
          >
            Settings
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className={cn(
            'h-8 w-8',
            effectiveTheme === 'dark'
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
          )}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
        {/* Theme Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Theme
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className={cn(
                'flex items-center gap-2',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/30 text-zinc-700 hover:bg-gray-200'
              )}
            >
              {getThemeIcon()}
              {getThemeLabel()}
            </Button>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs border-0',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 text-white/70'
                  : 'bg-white/30 text-zinc-600'
              )}
            >
              Ctrl+T
            </Badge>
          </div>
        </div>

        {/* Opacity Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Panel Opacity ({settings.opacity}%)
          </h3>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min="10"
              max="100"
              value={settings.opacity}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className={cn(
                'flex-1 border-zinc-500/10',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            />
            <Input
              type="number"
              min="10"
              max="100"
              value={settings.opacity}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className={cn(
                'w-16 border-zinc-500/10',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            />
          </div>
        </div>

        {/* AI Modes */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Modes
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              {
                icon: '🔍',
                name: 'General',
                prompt: `Analyze what you see on the screen in comprehensive detail.

Describe:
• Visual elements, layout, and structure
• Content and text visible
• Interactive elements and their state
• Overall purpose and context
• Any notable patterns or design choices`
              },
              {
                icon: '🖼️',
                name: 'UI',
                prompt: `Perform a detailed user interface analysis.

Examine:
• Navigation structure and menu organization
• Button placement and visual hierarchy
• Form elements and input fields
• Color scheme and visual consistency
• Spacing, alignment, and responsive design
• User experience patterns and usability`
              },
              {
                icon: '🐛',
                name: 'Bug',
                prompt: `Identify and analyze potential issues, errors, or bugs visible on the screen.

Look for:
• Error messages or warning indicators
• Broken layouts or misaligned elements
• Missing content or broken images
• Console errors or debug information
• Accessibility violations
• Performance issues or loading problems`
              },
              {
                icon: '💻',
                name: 'Code',
                prompt: `Analyze the code visible on the screen and provide detailed technical insights.

Focus on:
• Code structure, organization, and patterns
• Potential bugs, security issues, or performance problems
• Best practices and improvement suggestions
• Function/method analysis and logic flow
• Variable naming and code readability
• Architecture and design pattern recommendations`
              },
              {
                icon: '📋',
                name: 'Summary',
                prompt: `Provide a comprehensive summary of the content and information shown.

Include:
• Main topics and key points
• Important data, numbers, or statistics
• Action items or next steps mentioned
• Overall context and purpose
• Relationships between different elements
• Critical insights or takeaways`
              },
              {
                icon: '♿',
                name: 'A11y',
                prompt: `Conduct a thorough accessibility review and provide improvement recommendations.

Evaluate:
• Color contrast and readability
• Keyboard navigation and focus indicators
• Screen reader compatibility
• Alt text and semantic markup
• ARIA labels and roles
• Mobile accessibility and touch targets
• Compliance with WCAG guidelines`
              },
              {
                icon: '🎨',
                name: 'Design',
                prompt: `Analyze the visual design, aesthetics, and design system implementation.

Review:
• Typography choices, hierarchy, and readability
• Color palette, contrast, and brand consistency
• Visual balance, spacing, and composition
• Icon usage and visual language
• Component design and design system adherence
• Overall aesthetic appeal and modern design trends`
              },
              {
                icon: '🔒',
                name: 'Security',
                prompt: `Identify potential security concerns, vulnerabilities, and privacy issues.

Examine:
• Exposed sensitive information or credentials
• Input validation and data handling
• Authentication and authorization patterns
• HTTPS usage and secure connections
• Privacy concerns and data exposure
• Security headers and configuration
• Potential injection or XSS vulnerabilities`
              },
              {
                icon: '⚡',
                name: 'Perf',
                prompt: `Analyze performance aspects and suggest optimizations.

Focus on:
• Loading times and resource optimization
• Image sizes and compression opportunities
• Code bundling and minification
• Caching strategies and CDN usage
• Database queries and API efficiency
• Memory usage and potential leaks
• Rendering performance and smooth interactions`
              },
              {
                icon: '🎓',
                name: 'Learn',
                prompt: `Provide educational insights and learning opportunities based on what's shown.

Explain:
• Technologies, frameworks, or tools being used
• Concepts, patterns, or methodologies demonstrated
• Learning resources and next steps
• Best practices and industry standards
• How different components work together
• Skills or knowledge areas to develop further`
              }
            ].map((mode) => (
              <button
                key={mode.name}
                onClick={() => updateSettings({ defaultPrompt: mode.prompt })}
                className={cn(
                  'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                  'flex flex-col items-center gap-0.5 hover:scale-105 min-h-[50px]',
                  settings.defaultPrompt === mode.prompt
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/20 border-blue-400/50 text-blue-700'
                    : effectiveTheme === 'dark'
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-white/20 text-zinc-600 hover:bg-white/40'
                )}
              >
                <span className="text-xs">{mode.icon}</span>
                <span className="font-medium text-[10px] leading-tight">{mode.name}</span>
              </button>
            ))}
          </div>
          <div
            className={cn(
              'p-3 rounded border border-zinc-500/10 text-xs max-h-32 overflow-y-auto',
              effectiveTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-white/30 text-zinc-600'
            )}
          >
            <div className="font-medium mb-2 text-xs">Current Mode:</div>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {settings.defaultPrompt}
            </pre>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            AI Model
          </h3>
          <select
            value={settings.aiModel}
            onChange={(e) => updateSettings({ aiModel: e.target.value })}
            className={cn(
              'w-full p-2 rounded border border-zinc-500/10 text-sm',
              effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
            )}
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </select>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Show/Hide App
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+\
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Capture Screen
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+Enter
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Toggle Microphone
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+M
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Toggle Theme
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+T
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Close App
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+Q
              </Badge>
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-4 border-t border-zinc-500/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className={cn(
              'flex items-center gap-2 w-full',
              effectiveTheme === 'dark'
                ? 'text-red-400 hover:bg-red-500/20'
                : 'text-red-600 hover:bg-red-500/20'
            )}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
