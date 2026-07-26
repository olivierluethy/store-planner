import { IonIcon } from '@ionic/react'
import { lockClosedOutline } from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { StoreMap } from '../components/map/StoreMap'
import { Button } from '../components/ui/Button'
import type { Product } from '../types'

interface MapViewProps {
  onOpenDetail: (product: Product) => void
  onRequestLogin: () => void
}

export function MapView({ onOpenDetail, onRequestLogin }: MapViewProps) {
  const { isAuthenticated } = useAuth()
  const { loading, error, reload } = useStore()

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1120px] flex-col gap-3 px-4 py-4">
      {!isAuthenticated && (
        <div
          className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' }}
        >
          <IonIcon icon={lockClosedOutline} className="shrink-0 text-lg text-accent" />
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-soft">
            Du siehst den Ladenplan im Ansichtsmodus. Melde dich an, um Produkte zu
            platzieren und zu bearbeiten.
          </p>
          <Button size="sm" onClick={onRequestLogin} className="shrink-0">
            Anmelden
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid flex-1 place-items-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-mute border-t-accent" />
        </div>
      ) : error ? (
        <div className="grid flex-1 place-items-center gap-3 text-center">
          <p className="text-ink-soft">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => void reload()}>
            Erneut versuchen
          </Button>
        </div>
      ) : (
        <StoreMap enabled={isAuthenticated} onOpenDetail={onOpenDetail} />
      )}
    </div>
  )
}
