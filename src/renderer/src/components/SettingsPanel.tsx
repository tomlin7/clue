import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Moon, Palette, RotateCcw, Sun, X } from 'lucide-react'
import React, { useState } from 'react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, className }) => {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { theme, setTheme, effectiveTheme } = useTheme()
  const [tempPrompt, setTempPrompt] = useState(settings.defaultPrompt)

  if (!isOpen) return null

  const handleOpacityChange = (value: string) => {
    const opacity = Math.max(10, Math.min(100, parseInt(value) || 80))
    updateSettings({ opacity })
  }

  const handlePromptSave = () => {
    updateSettings({ defaultPrompt: tempPrompt })
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
        'backdrop-blur-md border rounded-lg shadow-xl transition-all duration-300',
        'min-w-[400px] max-w-[500px]',
        effectiveTheme === 'dark'
          ? 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
          : 'bg-white/20 border-black/10 hover:bg-white/30 hover:border-black/20',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b',
          effectiveTheme === 'dark' ? 'border-white/10' : 'border-black/10'
        )}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
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
              : 'text-black/70 hover:text-black hover:bg-black/10'
          )}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Theme Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-black'
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
                  : 'bg-black/10 text-black hover:bg-black/20'
              )}
            >
              {getThemeIcon()}
              {getThemeLabel()}
            </Button>
            <Badge variant="outline" className="text-xs">
              Ctrl+T
            </Badge>
          </div>
        </div>

        {/* Opacity Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-black'
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
                'flex-1',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/10 border-black/20 text-black'
              )}
            />
            <Input
              type="number"
              min="10"
              max="100"
              value={settings.opacity}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className={cn(
                'w-16',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/10 border-black/20 text-black'
              )}
            />
          </div>
        </div>

        {/* Default Prompt Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-black'
            )}
          >
            Default AI Prompt
          </h3>
          <div className="space-y-2">
            <textarea
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="Enter your default prompt for AI analysis..."
              rows={3}
              className={cn(
                'w-full p-2 rounded border resize-none text-sm',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50'
                  : 'bg-black/10 border-black/20 text-black placeholder:text-black/50'
              )}
            />
            <Button
              size="sm"
              onClick={handlePromptSave}
              disabled={tempPrompt === settings.defaultPrompt}
              className={cn('bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white')}
            >
              Save Prompt
            </Button>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-black'
            )}
          >
            AI Model
          </h3>
          <select
            value={settings.aiModel}
            onChange={(e) => updateSettings({ aiModel: e.target.value })}
            className={cn(
              'w-full p-2 rounded border text-sm',
              effectiveTheme === 'dark'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-black/10 border-black/20 text-black'
            )}
          >
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-pro-vision">Gemini Pro Vision</option>
          </select>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-black'
            )}
          >
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                Show/Hide App
              </span>
              <Badge variant="outline" className="text-xs">
                Ctrl+\
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                Capture Screen
              </span>
              <Badge variant="outline" className="text-xs">
                Ctrl+Enter
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                Toggle Microphone
              </span>
              <Badge variant="outline" className="text-xs">
                Ctrl+M
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                Toggle Theme
              </span>
              <Badge variant="outline" className="text-xs">
                Ctrl+T
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-black/70')}>
                Close App
              </span>
              <Badge variant="outline" className="text-xs">
                Ctrl+Q
              </Badge>
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-4 border-t border-white/10">
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
