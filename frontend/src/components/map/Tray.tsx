import { forwardRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Product } from '../../types'
import { TILE_SIZE } from './geometry'
import { TileVisual } from './ProductTile'

interface TrayProps {
  products: Product[]
  draggable: boolean
  highlighted: boolean
  draggingId: number | null
  onTilePointerDown: (e: ReactPointerEvent, product: Product) => void
}

/**
 * Bottom dock of unplaced products (zone_id = NULL). Horizontally scrollable and
 * itself a valid drop target — dropping a product here un-places it.
 */
export const Tray = forwardRef<HTMLDivElement, TrayProps>(function Tray(
  { products, draggable, highlighted, draggingId, onTilePointerDown },
  ref,
) {
  return (
    <div
      ref={ref}
      className="shrink-0 rounded-lg bg-layer p-3 transition-[box-shadow] duration-150"
      style={{
        boxShadow: highlighted ? 'var(--drop-glow)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        outline: highlighted ? '2px solid var(--drop-target-ring)' : '1px solid var(--border)',
        outlineOffset: '-1px',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Nicht platziert</span>
        <span className="tnum text-[11px] font-semibold text-ink-mute">{products.length}</span>
      </div>

      {products.length === 0 ? (
        <p className="flex h-[76px] items-center justify-center text-[13px] text-ink-mute">
          Alle Produkte sind platziert.
        </p>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1">
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0"
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                touchAction: 'none',
                cursor: draggable ? 'grab' : 'default',
                opacity: draggingId === product.id ? 0 : 1,
              }}
              onPointerDown={(e) => onTilePointerDown(e, product)}
            >
              <TileVisual product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
