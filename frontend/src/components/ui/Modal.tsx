import { IonModal } from '@ionic/react'
import { close } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * A centered dialog card built on IonModal (for gestures + backdrop) but styled
 * entirely to the styleguide. Used for every flow — login, register, create,
 * edit, profile, confirm — instead of page redirects.
 */
export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="sp-modal">
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col overflow-hidden rounded-lg bg-surface shadow-e3 ring-1 ring-line">
          <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-xl font-semibold tracking-[-0.015em] text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="grid h-9 w-9 place-items-center rounded-sm text-ink-soft transition-colors hover:bg-raised hover:text-ink"
            >
              <IonIcon icon={close} className="text-xl" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && (
            <footer className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </IonModal>
  )
}
