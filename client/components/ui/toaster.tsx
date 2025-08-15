'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToasterProps {
  toasts?: Toast[]
  onRemove?: (id: string) => void
}

export function Toaster({ toasts = [], onRemove }: ToasterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} px-4 py-2 rounded-lg shadow-lg max-w-sm transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(toast.id)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}
