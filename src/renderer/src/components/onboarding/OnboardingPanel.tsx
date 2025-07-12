import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useConfig } from '@/contexts/ConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { ArrowRight, FileText } from 'lucide-react'
import React, { useState } from 'react'

interface OnboardingPanelProps {
  className?: string
  onComplete: () => void
}

type OnboardingStep = 'welcome' | 'apiKey' | 'theme' | 'complete'

export const OnboardingPanel: React.FC<OnboardingPanelProps> = ({ className, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const { config, updateConfig, openConfigFile } = useConfig()
  const { theme, setTheme, effectiveTheme } = useTheme()

  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('apiKey')
        break
      case 'apiKey':
        setCurrentStep('theme')
        break
      case 'theme':
        setCurrentStep('complete')
        break
      case 'complete':
        localStorage.setItem('onboarding-completed', 'true')
        onComplete()
        break
    }
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true')
    onComplete()
  }

  const handleOpenConfig = async () => {
    try {
      await openConfigFile()
    } catch (error) {
      console.error('Failed to open config file:', error)
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const handleOpacityChange = (values: number[]) => {
    const opacity = Math.round(Math.max(10, Math.min(100, values[0])))
    updateConfig({ opacity })
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <h2
              className={cn(
                'text-lg font-semibold mb-3',
                effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
              )}
            >
              Welcome to Clue
            </h2>
            <p
              className={cn('mb-3', effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700')}
            >
              Your intelligent AI assistant that overlays on your screen. Let's get you set up in
              just a few steps.
            </p>
          </div>
        )

      case 'apiKey':
        return (
          <div className="space-y-4">
            <h2
              className={cn(
                'text-lg font-semibold mb-3',
                effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
              )}
            >
              Configure API Key
            </h2>
            <p
              className={cn('mb-3', effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700')}
            >
              To get started, you'll need to add your Google AI API key. We'll open the
              configuration file for you.
            </p>
            <Button
              onClick={handleOpenConfig}
              variant="ghost"
              className={cn(
                'h-8 w-full justify-start gap-2',
                effectiveTheme === 'dark'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
              )}
            >
              <FileText size={14} />
              Open Config File
            </Button>
          </div>
        )

      case 'theme':
        return (
          <div className="space-y-4">
            <h2
              className={cn(
                'text-lg font-semibold mb-3',
                effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
              )}
            >
              Customize Appearance
            </h2>
            <p
              className={cn('mb-3', effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700')}
            >
              Choose your preferred theme and adjust the opacity to your liking.
            </p>

            {/* Theme Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    onClick={() => handleThemeChange(option.value as any)}
                    className={cn(
                      'h-8 text-sm',
                      theme === option.value
                        ? effectiveTheme === 'dark'
                          ? 'text-blue-400 bg-blue-500/20'
                          : 'text-blue-600 bg-blue-100/60'
                        : effectiveTheme === 'dark'
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span
                  className={cn(
                    'text-sm',
                    effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                  )}
                >
                  Opacity
                </span>
                <Badge
                  className={cn(
                    'px-2 py-1 rounded font-normal text-xs',
                    effectiveTheme === 'dark'
                      ? 'bg-white/10 text-white/80'
                      : 'bg-zinc-500/10 text-zinc-500'
                  )}
                >
                  {Math.round(config.opacity)}%
                </Badge>
              </div>

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
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-4">
            <h2
              className={cn(
                'text-lg font-semibold mb-3',
                effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
              )}
            >
              You're All Set!
            </h2>
            <p
              className={cn('mb-3', effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700')}
            >
              Clue is ready to assist you. You can take screenshots, ask questions, and get
              AI-powered insights right from your desktop.
            </p>
            <p className="text-center py-4 text-sm">
              <Badge
                className={cn(
                  'px-2 py-1 rounded font-normal',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/80'
                    : 'bg-zinc-500/10 text-zinc-500'
                )}
              >
                Ctrl+Enter
              </Badge>{' '}
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500')}>
                to analyze screen
              </span>
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const getStepNumber = () => {
    switch (currentStep) {
      case 'welcome':
        return 1
      case 'apiKey':
        return 2
      case 'theme':
        return 3
      case 'complete':
        return 4
      default:
        return 1
    }
  }
  return (
    <div
      className={cn(
        'acrylic-panel',
        'flex flex-col',
        'rounded-lg panel-transition relative z-10',
        className
      )}
      style={{
        minHeight: '120px',
        maxHeight: '600px',
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out, backdrop-filter 0.6s ease-out'
      }}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div
        className={cn('flex items-center justify-between py-1 px-2 bottom-border relative z-20')}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'border-0 text-sm',
              effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
            )}
          >
            Setup ({getStepNumber()}/4)
          </Badge>
        </div>

        {currentStep !== 'complete' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className={cn(
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
            title="Skip setup"
          >
            <ArrowRight size={14} />
          </Button>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 overflow-y-auto relative z-20">
        <div className="space-y-4">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              variant="ghost"
              className={cn(
                'h-8 gap-2 relative z-20',
                effectiveTheme === 'dark'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
              )}
            >
              {currentStep === 'complete' ? 'Get Started' : 'Continue'}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
