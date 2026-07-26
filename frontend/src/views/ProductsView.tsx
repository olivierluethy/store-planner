import { useMemo, useState } from 'react'
import { IonIcon, IonReorder, IonReorderGroup } from '@ionic/react'
import type { ItemReorderEventDetail } from '@ionic/react'
import {
  addOutline,
  createOutline,
  reorderThreeOutline,
  searchOutline,
  swapVerticalOutline,
  trashOutline,
} from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { ProductImage } from '../components/ui/ProductImage'
import type { Product } from '../types'

type SortKey = 'manual' | 'name' | 'created' | 'updated' | 'zone'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'manual', label: 'Reihenfolge' },
  { key: 'name', label: 'Name' },
  { key: 'created', label: 'Erstellt' },
  { key: 'updated', label: 'Aktualisiert' },
  { key: 'zone', label: 'Regal' },
]

interface ProductsViewProps {
  onOpenDetail: (product: Product) => void
  onCreate: () => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductsView({ onOpenDetail, onCreate, onEdit, onDelete }: ProductsViewProps) {
  const { isAuthenticated } = useAuth()
  const { products, zones, reorder } = useStore()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('manual')
  const [asc, setAsc] = useState(true)

  const zoneName = useMemo(() => {
    const map = new Map<number, string>()
    for (const z of zones) map.set(z.id, z.name)
    return map
  }, [zones])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false),
        )
      : products
    const dir = asc ? 1 : -1
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'de') * dir
        case 'created':
          return a.created_at.localeCompare(b.created_at) * dir
        case 'updated':
          return a.updated_at.localeCompare(b.updated_at) * dir
        case 'zone': {
          const az = a.zone_id ? (zoneName.get(a.zone_id) ?? '') : '￿'
          const bz = b.zone_id ? (zoneName.get(b.zone_id) ?? '') : '￿'
          return az.localeCompare(bz, 'de') * dir
        }
        default:
          return (a.sort_order - b.sort_order) * dir
      }
    })
    return sorted
  }, [products, search, sort, asc, zoneName])

  const reorderable = isAuthenticated && sort === 'manual' && search.trim() === ''

  async function handleReorder(e: CustomEvent<ItemReorderEventDetail>) {
    const reordered = e.detail.complete(visible.slice()) as Product[]
    try {
      await reorder(reordered)
    } catch {
      toast('Reihenfolge konnte nicht gespeichert werden.', 'danger')
    }
  }

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[760px] flex-col px-4 py-4">
      {/* Controls */}
      <div className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IonIcon
            icon={searchOutline}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-mute"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Produkte suchen…"
            className="w-full rounded-sm bg-inset py-2.5 pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-mute outline-none ring-1 ring-line focus:ring-2 focus:ring-[color:var(--accent-ring)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-sm bg-inset px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-[color:var(--accent-ring)]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAsc((v) => !v)}
            aria-label="Sortierrichtung umkehren"
            className="grid h-10 w-10 place-items-center rounded-sm bg-raised text-ink-soft ring-1 ring-line transition-colors hover:text-ink"
          >
            <IonIcon icon={swapVerticalOutline} className={`text-lg ${asc ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        {visible.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <p className="text-ink-soft">Keine Produkte gefunden.</p>
            {isAuthenticated && (
              <button className="text-sm font-semibold text-accent" onClick={onCreate}>
                Erstes Produkt anlegen
              </button>
            )}
          </div>
        ) : (
          <IonReorderGroup disabled={!reorderable} onIonItemReorder={handleReorder}>
            {visible.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                location={product.zone_id ? (zoneName.get(product.zone_id) ?? null) : null}
                canEdit={isAuthenticated}
                reorderable={reorderable}
                onOpen={() => onOpenDetail(product)}
                onEdit={() => onEdit(product)}
                onDelete={() => onDelete(product)}
              />
            ))}
          </IonReorderGroup>
        )}
      </div>

      {/* Create FAB */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={onCreate}
          aria-label="Produkt erstellen"
          className="absolute bottom-6 right-5 grid h-14 w-14 place-items-center rounded-full bg-accent text-on-accent transition-transform hover:bg-accent-hi active:scale-95"
          style={{ boxShadow: 'var(--drag-shadow)' }}
        >
          <IonIcon icon={addOutline} className="text-2xl" />
        </button>
      )}
    </div>
  )
}

interface ProductRowProps {
  product: Product
  location: string | null
  canEdit: boolean
  reorderable: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

function ProductRow({
  product,
  location,
  canEdit,
  reorderable,
  onOpen,
  onEdit,
  onDelete,
}: ProductRowProps) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-md bg-surface p-3 ring-1 ring-line transition-colors hover:bg-raised">
      {reorderable && (
        <IonReorder>
          <span className="grid h-8 w-6 cursor-grab place-items-center text-ink-mute">
            <IonIcon icon={reorderThreeOutline} className="text-lg" />
          </span>
        </IonReorder>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ProductImage name={product.name} imageUrl={product.image_url} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{product.name}</p>
          {product.description && (
            <p className="truncate text-[13px] text-ink-mute">{product.description}</p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{
            background: location ? 'var(--accent-soft)' : 'var(--surface-inset)',
            color: location ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {location ?? 'Nicht platziert'}
        </span>
      </button>

      {canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Bearbeiten"
            className="grid h-9 w-9 place-items-center rounded-sm text-ink-soft transition-colors hover:bg-inset hover:text-ink"
          >
            <IonIcon icon={createOutline} className="text-lg" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Löschen"
            className="grid h-9 w-9 place-items-center rounded-sm text-ink-soft transition-colors hover:bg-[color:var(--danger-soft)] hover:text-danger"
          >
            <IonIcon icon={trashOutline} className="text-lg" />
          </button>
        </div>
      )}
    </div>
  )
}
