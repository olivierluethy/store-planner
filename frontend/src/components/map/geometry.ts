// Maps the fixed 1000x700 logical canvas onto the measured stage, so the layout
// scales identically on phone and desktop without re-persisting coordinates.
import { CANVAS } from '../../types'
import type { Size } from '../../hooks/useElementSize'
import type { Zone } from '../../types'

export interface Transform {
  scale: number
  offsetX: number
  offsetY: number
  stageW: number
  stageH: number
}

export const TILE_SIZE = 60 // fixed on-screen tile size (px), independent of scale

/** `object-fit: contain` transform for the logical canvas within `container`. */
export function computeTransform(container: Size): Transform {
  const scale = Math.min(container.width / CANVAS.width, container.height / CANVAS.height) || 0
  const stageW = CANVAS.width * scale
  const stageH = CANVAS.height * scale
  return {
    scale,
    offsetX: (container.width - stageW) / 2,
    offsetY: (container.height - stageH) / 2,
    stageW,
    stageH,
  }
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** Zone box in container-local pixels. */
export function zoneRect(zone: Zone, t: Transform): Rect {
  return {
    left: t.offsetX + zone.x * t.scale,
    top: t.offsetY + zone.y * t.scale,
    width: zone.w * t.scale,
    height: zone.h * t.scale,
  }
}

/** Centre of a placed product in container-local pixels. */
export function placedCenter(zone: Zone, posX: number, posY: number, t: Transform): { x: number; y: number } {
  const cx = zone.x + posX * zone.w
  const cy = zone.y + posY * zone.h
  return { x: t.offsetX + cx * t.scale, y: t.offsetY + cy * t.scale }
}

/** Convert a container-local point to zone-relative pos (0..1), clamped. */
export function pointToZonePos(
  zone: Zone,
  localX: number,
  localY: number,
  t: Transform,
): { pos_x: number; pos_y: number } {
  const logicalX = (localX - t.offsetX) / t.scale
  const logicalY = (localY - t.offsetY) / t.scale
  const px = (logicalX - zone.x) / zone.w
  const py = (logicalY - zone.y) / zone.h
  return {
    pos_x: clamp(px, 0.02, 0.98),
    pos_y: clamp(py, 0.02, 0.98),
  }
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.left && px <= r.left + r.width && py >= r.top && py <= r.top + r.height
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
