import { useMemo, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { addOutline, searchOutline, swapVerticalOutline } from 'ionicons/icons'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { ReorderableProductList } from '../components/products/ReorderableProductList'
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
  const showSortHint = isAuthenticated && sort !== 'manual'

  async function handleReorder(from: number, to: number) {
    const reordered = visible.slice()
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
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

      {/* Manual-order hint */}
      {showSortHint && (
        <p className="mb-2 shrink-0 text-[13px] text-ink-mute">
          Sortierung auf «Reihenfolge» stellen, um Produkte manuell zu ordnen.
        </p>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center gap-2 py-16 text-center">
          <p className="text-ink-soft">Keine Produkte gefunden.</p>
          {isAuthenticated && (
            <button className="text-sm font-semibold text-accent" onClick={onCreate}>
              Erstes Produkt anlegen
            </button>
          )}
        </div>
      ) : (
        <ReorderableProductList
          items={visible}
          zoneName={zoneName}
          canEdit={isAuthenticated}
          reorderable={reorderable}
          onOpen={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onReorder={handleReorder}
        />
      )}

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
