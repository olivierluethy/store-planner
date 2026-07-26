import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Product, Zone } from '../../types'
import type { Transform } from './geometry'
import { placedCenter, pointInRect, pointToZonePos, zoneRect } from './geometry'

export type DropResult =
  | { kind: 'zone'; zone_id: number; pos_x: number; pos_y: number }
  | { kind: 'tray' }
  | { kind: 'snap' }

interface DragState {
  product: Product | null
  ghostX: number
  ghostY: number
  hoveredZoneId: number | null
  overTray: boolean
  /** Container-local point where the tile would land (valid zone only). */
  landingX: number | null
  landingY: number | null
  /** Dragging but over no valid target (will snap back). */
  overInvalid: boolean
}

const IDLE: DragState = {
  product: null,
  ghostX: 0,
  ghostY: 0,
  hoveredZoneId: null,
  overTray: false,
  landingX: null,
  landingY: null,
  overInvalid: false,
}

const MOVE_THRESHOLD = 6 // px before a press counts as a drag
const HOLD_THRESHOLD = 120 // ms hold that visually lifts the tile

interface Options {
  enabled: boolean
  zones: Zone[]
  containerRef: RefObject<HTMLElement | null>
  trayRef: RefObject<HTMLElement | null>
  getTransform: () => Transform
  onDrop: (product: Product, result: DropResult) => void
  onTap: (product: Product) => void
}

export function useDragController(opts: Options) {
  const [state, setState] = useState<DragState>(IDLE)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const teardownRef = useRef<(() => void) | null>(null)

  const resolveHover = useCallback((clientX: number, clientY: number) => {
    const { containerRef, trayRef, zones, getTransform } = optsRef.current
    const container = containerRef.current
    if (!container) return { hoveredZoneId: null, overTray: false, localX: 0, localY: 0 }
    const box = container.getBoundingClientRect()
    const localX = clientX - box.left
    const localY = clientY - box.top

    const trayEl = trayRef.current
    if (trayEl) {
      const tr = trayEl.getBoundingClientRect()
      if (clientX >= tr.left && clientX <= tr.right && clientY >= tr.top && clientY <= tr.bottom) {
        return { hoveredZoneId: null, overTray: true, localX, localY }
      }
    }

    const t = getTransform()
    let hoveredZoneId: number | null = null
    for (const zone of zones) {
      if (pointInRect(localX, localY, zoneRect(zone, t))) {
        hoveredZoneId = zone.id
        break
      }
    }
    return { hoveredZoneId, overTray: false, localX, localY }
  }, [])

  const startDrag = useCallback(
    (e: ReactPointerEvent, product: Product) => {
      // Left button / primary pointer only. Note: we attach in read-only mode
      // too, so a plain tap still opens the detail modal — dragging is what's
      // gated on `enabled`, not tap detection.
      if (e.button !== undefined && e.button !== 0) return

      const session = {
        startX: e.clientX,
        startY: e.clientY,
        began: false,
        moved: false,
        holdTimer: 0,
      }

      const teardown = () => {
        window.clearTimeout(session.holdTimer)
        window.removeEventListener('pointermove', move, { capture: false } as EventListenerOptions)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', cancel)
        teardownRef.current = null
        setState(IDLE)
      }

      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - session.startX
        const dy = ev.clientY - session.startY
        if (!session.moved && Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
          session.moved = true
          if (optsRef.current.enabled) session.began = true
        }
        if (!optsRef.current.enabled || !session.began) return
        ev.preventDefault()
        const { hoveredZoneId, overTray, localX, localY } = resolveHover(ev.clientX, ev.clientY)
        let landingX: number | null = null
        let landingY: number | null = null
        if (hoveredZoneId !== null) {
          const t = optsRef.current.getTransform()
          const zone = optsRef.current.zones.find((z) => z.id === hoveredZoneId)
          if (zone) {
            const { pos_x, pos_y } = pointToZonePos(zone, localX, localY, t)
            const c = placedCenter(zone, pos_x, pos_y, t)
            landingX = c.x
            landingY = c.y
          }
        }
        setState({
          product,
          ghostX: ev.clientX,
          ghostY: ev.clientY,
          hoveredZoneId,
          overTray,
          landingX,
          landingY,
          overInvalid: hoveredZoneId === null && !overTray,
        })
      }

      const up = (ev: PointerEvent) => {
        const moved = session.moved
        teardown()
        if (!moved) {
          optsRef.current.onTap(product)
          return
        }
        if (!optsRef.current.enabled) return // moved in read-only mode → no-op
        const { hoveredZoneId, overTray, localX, localY } = resolveHover(ev.clientX, ev.clientY)
        if (overTray) {
          optsRef.current.onDrop(product, { kind: 'tray' })
          return
        }
        if (hoveredZoneId !== null) {
          const zone = optsRef.current.zones.find((z) => z.id === hoveredZoneId)
          if (zone) {
            const { pos_x, pos_y } = pointToZonePos(zone, localX, localY, optsRef.current.getTransform())
            optsRef.current.onDrop(product, { kind: 'zone', zone_id: zone.id, pos_x, pos_y })
            return
          }
        }
        optsRef.current.onDrop(product, { kind: 'snap' })
      }

      const cancel = () => {
        teardown()
        optsRef.current.onDrop(product, { kind: 'snap' })
      }

      teardownRef.current = teardown
      session.holdTimer = window.setTimeout(() => {
        if (optsRef.current.enabled && !session.began) {
          session.began = true
          setState({
            product,
            ghostX: session.startX,
            ghostY: session.startY,
            hoveredZoneId: null,
            overTray: false,
            landingX: null,
            landingY: null,
            overInvalid: false,
          })
        }
      }, HOLD_THRESHOLD)

      window.addEventListener('pointermove', move, { passive: false })
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', cancel)
    },
    [resolveHover],
  )

  // Cleanup any in-flight drag on unmount.
  useEffect(() => () => teardownRef.current?.(), [])

  return { state, startDrag, isDragging: state.product !== null }
}
