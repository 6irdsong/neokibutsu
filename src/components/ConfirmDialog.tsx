'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  destructive?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    return new Promise(resolve => {
      resolveRef.current = resolve
    })
  }, [])

  function handleResult(result: boolean) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && <ConfirmModal options={options} onResult={handleResult} />}
    </ConfirmContext.Provider>
  )
}

function ConfirmModal({ options, onResult }: { options: ConfirmOptions; onResult: (v: boolean) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResult(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResult])

  return (
    <div
      className={`fixed inset-0 z-[10001] flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => onResult(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card-bg border border-border rounded-md p-6 max-w-[380px] w-[90%] shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="m-0 mb-2 text-sm font-semibold text-text">{options.title}</h3>
        <p className="m-0 mb-5 text-[13px] text-dark-gray leading-relaxed">{options.message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onResult(false)}
            className="py-1.5 px-4 text-xs rounded-md border border-border bg-transparent text-text cursor-pointer hover:opacity-80 transition-opacity"
          >
            {options.cancelLabel || 'キャンセル'}
          </button>
          <button
            onClick={() => onResult(true)}
            className={`py-1.5 px-4 text-xs rounded-md border-none cursor-pointer hover:opacity-80 transition-opacity ${
              options.destructive
                ? 'bg-[#d9534f] text-white'
                : 'bg-accent text-btn-text-on-accent'
            }`}
          >
            {options.confirmLabel || (options.destructive ? '実行' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  )
}
