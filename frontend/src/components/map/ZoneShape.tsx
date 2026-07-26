import type { Zone } from '../../types'
import type { Rect } from './geometry'

interface ZoneShapeProps {
  zone: Zone
  rect: Rect
  count: number
  highlighted: boolean
}

/** A shelf or window surface on the floor. Windows read as the shopfront. */
export function ZoneShape({ zone, rect, count, highlighted }: ZoneShapeProps) {
  const isWindow = zone.type === 'window'

  return (
    <div
      className="absolute transition-[box-shadow,background-color] duration-150"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: isWindow ? 'var(--radius-md)' : 'var(--radius-lg)',
        background: highlighted ? 'var(--drop-valid-fill)' : isWindow ? 'var(--surface-raised)' : 'var(--surface)',
        boxShadow: highlighted
          ? 'var(--drop-glow)'
          : isWindow
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), var(--elev-1)'
            : 'var(--elev-1)',
        outline: highlighted
          ? '2px solid var(--accent)'
          : `1px solid ${isWindow ? 'var(--border-strong)' : 'var(--border)'}`,
        outlineOffset: highlighted ? '-2px' : '-1px',
      }}
    >
      {/* Glass highlight strip along the top of a window. */}
      {isWindow && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-[var(--radius-md)]"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)' }}
        />
      )}

      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className={`eyebrow !text-[10px] ${highlighted ? 'text-ink' : 'text-ink-soft'}`}>
          {zone.name}
        </span>
      </div>

      <span
        className="tnum absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold"
        style={{
          background: count > 0 ? 'var(--accent-soft)' : 'var(--surface-inset)',
          color: count > 0 ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </div>
  )
}
