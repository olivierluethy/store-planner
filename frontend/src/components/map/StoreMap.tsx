import { useMemo, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Product } from '../../types'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { useElementSize } from '../../hooks/useElementSize'
import { computeTransform, placedCenter, zoneRect } from './geometry'
import type { Transform } from './geometry'
import { useDragController } from './useDragController'
import type { DropResult } from './useDragController'
import { ZoneShape } from './ZoneShape'
import { DragGhost, LandingGhost, PlacedTile } from './ProductTile'
import { Tray } from './Tray'

interface StoreMapProps {
  enabled: boolean
  onOpenDetail: (product: Product) => void
}

export function StoreMap({ enabled, onOpenDetail }: StoreMapProps) {
  const { zones, products, placeProduct } = useStore()
  const { toast } = useToast()

  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const trayRef = useRef<HTMLDivElement>(null)

  const transform = useMemo<Transform>(() => computeTransform(size), [size])
  const transformRef = useRef(transform)
  transformRef.current = transform

  const placed = useMemo(() => products.filter((p) => p.zone_id !== null), [products])
  const unplaced = useMemo(() => products.filter((p) => p.zone_id === null), [products])

  const countByZone = useMemo(() => {
    const map = new Map<number, number>()
    for (const p of placed) {
      if (p.zone_id !== null) map.set(p.zone_id, (map.get(p.zone_id) ?? 0) + 1)
    }
    return map
  }, [placed])

  async function handleDrop(product: Product, result: DropResult) {
    if (result.kind === 'snap') return
    const placement =
      result.kind === 'tray'
        ? { zone_id: null, pos_x: null, pos_y: null }
        : { zone_id: result.zone_id, pos_x: result.pos_x, pos_y: result.pos_y }
    try {
      await placeProduct(product.id, placement)
    } catch {
      toast('Platzierung konnte nicht gespeichert werden.', 'danger')
    }
  }

  const { state, startDrag } = useDragController({
    enabled,
    zones,
    containerRef,
    trayRef,
    getTransform: () => transformRef.current,
    onDrop: handleDrop,
    onTap: onOpenDetail,
  })

  const draggingId = state.product?.id ?? null
  const gridCell = 40 * transform.scale

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Stage */}
      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
        {size.width > 0 && (
          <>
            {/* Floor with subtle grid */}
            <div
              className="absolute rounded-xl"
              style={{
                left: transform.offsetX,
                top: transform.offsetY,
                width: transform.stageW,
                height: transform.stageH,
                backgroundColor: 'var(--bg-layer)',
                backgroundImage:
                  'linear-gradient(var(--surface-inset) 1px, transparent 1px), linear-gradient(90deg, var(--surface-inset) 1px, transparent 1px)',
                backgroundSize: `${gridCell}px ${gridCell}px`,
                boxShadow: 'inset 0 0 0 1px var(--border), inset 0 2px 24px rgba(0,0,0,0.35)',
              }}
            />

            {zones.map((zone) => (
              <ZoneShape
                key={zone.id}
                zone={zone}
                rect={zoneRect(zone, transform)}
                count={countByZone.get(zone.id) ?? 0}
                highlighted={state.hoveredZoneId === zone.id}
              />
            ))}

            {placed.map((product) => {
              const zone = zones.find((z) => z.id === product.zone_id)
              if (!zone || product.pos_x === null || product.pos_y === null) return null
              return (
                <PlacedTile
                  key={product.id}
                  product={product}
                  center={placedCenter(zone, product.pos_x, product.pos_y, transform)}
                  draggable={enabled}
                  hidden={draggingId === product.id}
                  onPointerDown={(e: ReactPointerEvent) => startDrag(e, product)}
                />
              )
            })}

            {/* Dashed outline at the exact landing spot inside a valid zone */}
            {state.product && state.landingX !== null && state.landingY !== null && (
              <LandingGhost x={state.landingX} y={state.landingY} />
            )}

            {state.product && (
              <DragGhost
                product={state.product}
                x={state.ghostX}
                y={state.ghostY}
                invalid={state.overInvalid}
              />
            )}
          </>
        )}
      </div>

      {/* Unplaced tray */}
      <Tray
        ref={trayRef}
        products={unplaced}
        draggable={enabled}
        highlighted={state.overTray}
        draggingId={draggingId}
        onTilePointerDown={(e, product) => startDrag(e, product)}
      />
    </div>
  )
}
