import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useConfig } from '@/contexts/ConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ExternalLink, FileText, Moon, Palette, RotateCcw, Sun, X } from 'lucide-react'
import React, { useState } from 'react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, className }) => {
  const { config, updateConfig, selectMode, getSelectedMode, resetConfig, addMode, deleteMode } =
    useConfig()
  const { theme, setTheme, effectiveTheme } = useTheme()
  const [showAddMode, setShowAddMode] = useState(false)
  const [newMode, setNewMode] = useState({ name: '', icon: '', prompt: '', category: '' })

  if (!isOpen) return null

  const selectedMode = getSelectedMode()

  const handleOpacityChange = (values: number[]) => {
    const opacity = Math.round(Math.max(10, Math.min(100, values[0])))
    updateConfig({ opacity })
  }

  const handleOpacityInputChange = (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    const opacity = Math.round(Math.max(10, Math.min(100, numValue)))
    updateConfig({ opacity })
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
            Panel Opacity ({config.opacity}%)
          </h3>
          <div className="flex items-center gap-3">
            <Slider
              value={[config.opacity]}
              onValueChange={handleOpacityChange}
              min={10}
              max={100}
              step={1}
              className={cn(
                'flex-1',
                '[&_[data-slot=slider-track]]:bg-zinc-500/20',
                '[&_[data-slot=slider-range]]:bg-blue-500',
                '[&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-blue-500',
                effectiveTheme === 'dark'
                  ? '[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-thumb]]:bg-white'
                  : '[&_[data-slot=slider-track]]:bg-zinc-500/20 [&_[data-slot=slider-thumb]]:bg-white'
              )}
            />
            <Input
              type="number"
              min={10}
              max={100}
              step={1}
              value={config.opacity}
              onChange={(e) => handleOpacityInputChange(e.target.value)}
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
            {config.modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => selectMode(mode.id)}
                className={cn(
                  'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                  'flex flex-col items-center gap-0.5 hover:scale-105 min-h-[50px]',
                  selectedMode?.id === mode.id
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
              {selectedMode?.prompt || 'No mode selected'}
            </pre>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Configuration
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  config.apiKey.length > 0
                    ? effectiveTheme === 'dark'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-green-500/20 text-green-700'
                    : effectiveTheme === 'dark'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-red-500/20 text-red-700'
                )}
              >
                {config.apiKey.length > 0 ? '✓ API Key Set' : '⚠ No API Key'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.electronAPI.config.openConfigFile()}
                className={cn(
                  'flex items-center gap-2 justify-start',
                  effectiveTheme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
                )}
              >
                <FileText size={14} />
                Edit Config File
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.electronAPI.config.openConfigFolder()}
                className={cn(
                  'flex items-center gap-2 justify-start',
                  effectiveTheme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
                )}
              >
                <ExternalLink size={14} />
                Open Config Folder
              </Button>
            </div>

            <p
              className={cn(
                'text-xs',
                effectiveTheme === 'dark' ? 'text-white/60' : 'text-zinc-600'
              )}
            >
              Edit the config file to set your Google API key and customize AI modes. Get your API
              key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'underline hover:no-underline',
                  effectiveTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                )}
              >
                Google AI Studio
              </a>
            </p>
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
            value={config.aiModel}
            onChange={(e) => updateConfig({ aiModel: e.target.value })}
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
            onClick={resetConfig}
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
