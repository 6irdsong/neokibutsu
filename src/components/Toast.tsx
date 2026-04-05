'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast])

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      onClick={onDismiss}
      className={`pointer-events-auto cursor-pointer py-2.5 px-4 rounded-md text-[13px] shadow-md transition-all duration-300 max-w-[320px] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        toast.type === 'success'
          ? 'bg-[#2d7a3a] text-white'
          : 'bg-[#d9534f] text-white'
      }`}
    >
      {toast.message}
    </div>
  )
}
