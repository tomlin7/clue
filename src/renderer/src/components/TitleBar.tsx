import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import React from 'react'

interface TitleBarProps {
  className?: string
}

export const TitleBar: React.FC<TitleBarProps> = ({ className }) => {
  const { effectiveTheme } = useTheme()

  const handleClose = () => {
    window.electronAPI.closeApp()
  }

  return (
    <div
      className={cn('fixed top-0 right-0 z-50 p-2', className)}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className={cn(
          'h-8 w-8 rounded-full transition-all duration-200',
          'hover:scale-110',
          effectiveTheme === 'dark'
            ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white'
            : 'bg-red-600/20 hover:bg-red-600 text-red-600 hover:text-white'
        )}
      >
        <X size={14} />
      </Button>
    </div>
  )
}
