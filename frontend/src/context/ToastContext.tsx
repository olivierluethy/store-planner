import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastVariant = 'info' | 'success' | 'danger'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const BAR: Record<ToastVariant, string> = {
  info: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, variant }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const value = useMemo<ToastApi>(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[99999] flex flex-col items-center gap-2 px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-stretch overflow-hidden rounded-md bg-raised shadow-e3 ring-1 ring-line"
          >
            <span className={`w-1 shrink-0 ${BAR[t.variant]}`} />
            <p className="px-4 py-3 text-sm text-ink">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
