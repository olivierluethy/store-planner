import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Product } from '../../types'
import { ProductImage } from '../ui/ProductImage'
import { TILE_SIZE } from './geometry'

/** The shared visual: a framed product image with its name on a pill below. */
function TileVisual({ product, grabbed }: { product: Product; grabbed?: boolean }) {
  return (
    <div className="relative" style={{ width: TILE_SIZE, height: TILE_SIZE }}>
      <ProductImage
        name={product.name}
        imageUrl={product.image_url}
        rounded="rounded-md"
        className="h-full w-full bg-raised ring-1 ring-line"
      />
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-1 max-w-[92px] -translate-x-1/2 truncate rounded-full px-2 py-0.5 text-center text-[11px] font-medium"
        style={{
          background: grabbed ? 'var(--accent-soft)' : 'rgba(16,21,27,0.86)',
          color: grabbed ? 'var(--accent)' : 'var(--text-secondary)',
        }}
      >
        {product.name}
      </span>
    </div>
  )
}

interface PlacedTileProps {
  product: Product
  center: { x: number; y: number }
  draggable: boolean
  hidden: boolean
  onPointerDown: (e: ReactPointerEvent) => void
}

/** A product placed inside a zone, absolutely positioned and centred on its point. */
export function PlacedTile({ product, center, draggable, hidden, onPointerDown }: PlacedTileProps) {
  return (
    <div
      className="absolute transition-opacity"
      style={{
        left: center.x,
        top: center.y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        opacity: hidden ? 0 : 1,
        touchAction: 'none',
        cursor: draggable ? 'grab' : 'default',
      }}
      onPointerDown={onPointerDown}
    >
      <TileVisual product={product} />
    </div>
  )
}

/** The floating clone that follows the pointer during a drag. */
export function DragGhost({
  product,
  x,
  y,
  invalid = false,
}: {
  product: Product
  x: number
  y: number
  invalid?: boolean
}) {
  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: x,
        top: y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        transform: 'translate(-50%, -50%) scale(1.06)',
        filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.5))',
      }}
    >
      <div
        style={{
          boxShadow: invalid
            ? '0 0 0 2px var(--drop-invalid-ring)'
            : 'var(--drag-shadow)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <TileVisual product={product} grabbed={!invalid} />
      </div>
    </div>
  )
}

/** Dashed outline showing exactly where a tile will land inside a valid zone. */
export function LandingGhost({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-[15]"
      style={{
        left: x,
        top: y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        transform: 'translate(-50%, -50%)',
        border: '1.5px dashed var(--accent)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-soft)',
      }}
    />
  )
}

export { TileVisual }
