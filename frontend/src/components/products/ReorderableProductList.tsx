import { forwardRef, useCallback, useEffect, useReducer, useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { IonIcon } from '@ionic/react'
import { createOutline, reorderThreeOutline, trashOutline } from 'ionicons/icons'
import { ProductImage } from '../ui/ProductImage'
import type { Product } from '../../types'

const MOVE_THRESHOLD = 6 // px before a press becomes a drag
const LONG_PRESS = 300 // ms hold on a row (touch) to start a drag
const EDGE = 80 // px auto-scroll trigger zone
const MIN_SPEED = 4
const MAX_SPEED = 18

interface Props {
  items: Product[]
  zoneName: Map<number, string>
  canEdit: boolean
  reorderable: boolean
  onOpen: (p: Product) => void
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
  onReorder: (from: number, to: number) => void
}

interface Session {
  index: number
  mode: 'handle' | 'row'
  active: boolean
  pointerY: number
  startClientX: number
  startClientY: number
  startScrollTop: number
  stride: number
  rowH: number
  firstTop: number
  targetIndex: number
}

export function ReorderableProductList({
  items,
  zoneName,
  canEdit,
  reorderable,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const sessionRef = useRef<Session | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number>(0)
  const suppressClickRef = useRef(false)
  const [, force] = useReducer((x: number) => x + 1, 0)

  const count = items.length

  const recomputeTarget = useCallback(() => {
    const d = sessionRef.current
    const sc = scrollRef.current
    if (!d || !sc) return
    const rect = sc.getBoundingClientRect()
    const contentY = d.pointerY - rect.top + sc.scrollTop
    let k = 0
    for (let i = 0; i < count; i++) {
      if (i === d.index) continue
      const mid = d.firstTop + i * d.stride + d.rowH / 2
      if (mid < contentY) k++
    }
    d.targetIndex = k
  }, [count])

  const runAutoScroll = useCallback(() => {
    const d = sessionRef.current
    const sc = scrollRef.current
    if (!d || !sc) return
    const rect = sc.getBoundingClientRect()
    let ds = 0
    if (d.pointerY < rect.top + EDGE) {
      const dist = Math.max(0, d.pointerY - rect.top)
      ds = -(MIN_SPEED + (MAX_SPEED - MIN_SPEED) * (1 - dist / EDGE))
    } else if (d.pointerY > rect.bottom - EDGE) {
      const dist = Math.max(0, rect.bottom - d.pointerY)
      ds = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * (1 - dist / EDGE)
    }
    if (ds !== 0) {
      const before = sc.scrollTop
      sc.scrollTop += ds
      if (sc.scrollTop !== before) {
        recomputeTarget()
        force()
      }
    }
    rafRef.current = requestAnimationFrame(runAutoScroll)
  }, [recomputeTarget])

  const endSession = useCallback((commit: boolean) => {
    const d = sessionRef.current
    teardownRef.current?.()
    teardownRef.current = null
    cancelAnimationFrame(rafRef.current)
    if (d?.active && commit && d.targetIndex !== d.index) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 350)
      onReorder(d.index, d.targetIndex)
    }
    sessionRef.current = null
    force()
  }, [onReorder])

  const startSession = useCallback(
    (e: ReactPointerEvent, index: number, mode: 'handle' | 'row') => {
      if (!reorderable) return
      if (e.button !== undefined && e.button !== 0) return
      const isTouch = e.pointerType === 'touch'
      // Desktop reorder is handle-only; a row press there just opens detail.
      if (mode === 'row' && !isTouch) return

      const session: Session = {
        index,
        mode,
        active: false,
        pointerY: e.clientY,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startScrollTop: scrollRef.current?.scrollTop ?? 0,
        stride: 0,
        rowH: 0,
        firstTop: 0,
        targetIndex: index,
      }
      sessionRef.current = session

      let longPressTimer = 0

      const measure = (): boolean => {
        const rows = rowRefs.current
        const el0 = rows[0]
        const sc = scrollRef.current
        if (!el0 || !sc) return false
        const el1 = rows[1]
        session.firstTop = el0.offsetTop
        session.rowH = el0.offsetHeight
        session.stride = el1 ? el1.offsetTop - el0.offsetTop : session.rowH + 8
        session.startScrollTop = sc.scrollTop
        return true
      }

      const activate = () => {
        if (session.active) return
        if (!measure()) return
        session.active = true
        recomputeTarget()
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(runAutoScroll)
        force()
      }

      const onMove = (ev: PointerEvent) => {
        session.pointerY = ev.clientY
        if (!session.active) {
          const moved = Math.hypot(ev.clientX - session.startClientX, ev.clientY - session.startClientY)
          if (moved >= MOVE_THRESHOLD) {
            if (mode === 'handle') {
              activate()
            } else {
              // Movement during the long-press wait = the user is scrolling.
              window.clearTimeout(longPressTimer)
              endSession(false)
            }
          }
          return
        }
        ev.preventDefault()
        recomputeTarget()
        force()
      }

      const onUp = () => {
        window.clearTimeout(longPressTimer)
        endSession(true)
      }

      const onCancel = () => {
        window.clearTimeout(longPressTimer)
        endSession(false)
      }

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          window.clearTimeout(longPressTimer)
          endSession(false)
        }
      }

      teardownRef.current = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('keydown', onKey)
      }

      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('keydown', onKey)

      if (mode === 'row') {
        longPressTimer = window.setTimeout(activate, LONG_PRESS)
      }
    },
    [reorderable, recomputeTarget, runAutoScroll, endSession],
  )

  useEffect(() => () => teardownRef.current?.(), [])

  const d = sessionRef.current

  const rowStyle = (i: number): CSSProperties => {
    if (!d || !d.active) return {}
    if (i === d.index) {
      const sc = scrollRef.current
      const follow = d.pointerY - d.startClientY + (sc ? sc.scrollTop - d.startScrollTop : 0)
      return {
        transform: `translate3d(0, ${follow}px, 0) scale(1.015)`,
        transition: 'none',
        zIndex: 30,
        position: 'relative',
        boxShadow: '0 0 0 1px var(--row-grabbed-border), var(--elev-3)',
        cursor: 'grabbing',
      }
    }
    let ty = 0
    if (d.targetIndex > d.index) {
      if (i > d.index && i <= d.targetIndex) ty = -d.stride
    } else if (d.targetIndex < d.index) {
      if (i >= d.targetIndex && i < d.index) ty = d.stride
    }
    return {
      transform: `translate3d(0, ${ty}px, 0)`,
      transition: 'transform 150ms ease-out',
      zIndex: 1,
    }
  }

  const insertionY =
    d && d.active && d.targetIndex !== d.index
      ? d.firstTop + d.targetIndex * d.stride - (d.stride - d.rowH) / 2
      : null

  return (
    <div
      ref={scrollRef}
      tabIndex={-1}
      className="relative min-h-0 flex-1 overflow-y-auto pb-24 outline-none"
    >
      {items.map((product, i) => (
        <ReorderRow
          key={product.id}
          ref={(el) => {
            rowRefs.current[i] = el
          }}
          product={product}
          location={product.zone_id ? (zoneName.get(product.zone_id) ?? null) : null}
          canEdit={canEdit}
          reorderable={reorderable}
          style={rowStyle(i)}
          onHandlePointerDown={(e) => startSession(e, i, 'handle')}
          onRowPointerDown={(e) => startSession(e, i, 'row')}
          onOpen={() => {
            if (suppressClickRef.current) return
            onOpen(product)
          }}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
        />
      ))}

      {insertionY !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 rounded-full"
          style={{
            top: insertionY,
            background: 'var(--insertion-line)',
            boxShadow: '0 0 8px var(--accent-ring)',
          }}
        />
      )}
    </div>
  )
}

// --- Row --------------------------------------------------------------------

interface RowProps {
  product: Product
  location: string | null
  canEdit: boolean
  reorderable: boolean
  style: CSSProperties
  onHandlePointerDown: (e: ReactPointerEvent) => void
  onRowPointerDown: (e: ReactPointerEvent) => void
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

const ReorderRow = forwardRef<HTMLDivElement, RowProps>(function ReorderRow(
  { product, location, canEdit, reorderable, style, onHandlePointerDown, onRowPointerDown, onOpen, onEdit, onDelete },
  ref,
) {
  return (
    <div
      ref={ref}
      style={style}
      className="mb-2 flex items-center gap-3 rounded-md bg-surface p-3 ring-1 ring-line transition-colors hover:bg-raised"
    >
      {canEdit && (
        <span
          onPointerDown={reorderable ? onHandlePointerDown : undefined}
          className={`drag-handle grid h-8 w-6 place-items-center ${
            reorderable ? 'cursor-grab text-ink-mute' : 'cursor-default text-ink-mute'
          }`}
          style={{ touchAction: 'none', opacity: reorderable ? 1 : 0.35 }}
          aria-hidden={!reorderable}
        >
          <IonIcon icon={reorderThreeOutline} className="text-lg" />
        </span>
      )}

      <button
        type="button"
        onPointerDown={onRowPointerDown}
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
})
