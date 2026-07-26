import { IonIcon } from '@ionic/react'
import { personCircleOutline, storefront } from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'

export type View = 'map' | 'products'

interface HeaderProps {
  view: View
  onViewChange: (view: View) => void
  onLogin: () => void
  onProfile: () => void
}

const TABS: { id: View; label: string }[] = [
  { id: 'map', label: 'Ladenplan' },
  { id: 'products', label: 'Produkte' },
]

export function Header({ view, onViewChange, onLogin, onProfile }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header
      className="shrink-0 border-b border-line bg-floor"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-md text-on-accent"
            style={{ background: 'var(--accent)', boxShadow: 'var(--drop-glow)' }}
          >
            <IonIcon icon={storefront} className="text-lg" />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">Ladenplaner</span>
        </div>

        {user ? (
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-2 rounded-full bg-raised py-1 pl-1.5 pr-3 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:ring-line-strong"
          >
            <IonIcon icon={personCircleOutline} className="text-xl text-accent" />
            <span className="max-w-[140px] truncate">{user.display_name}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hi"
          >
            Anmelden
          </button>
        )}
      </div>

      {/* Segmented view switch */}
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-3">
        <div className="inline-flex rounded-full bg-inset p-1 ring-1 ring-line">
          {TABS.map((tab) => {
            const active = view === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-accent text-on-accent' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
