import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

export interface SegmentOption<T extends string> {
  id: T
  label: string
}

interface SegmentNavProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}

/**
 * Custom segmented control (styleguide §12.2). A pill container with equal-width
 * buttons and a sliding accent indicator behind the active label. Deliberately
 * NOT an IonSegment — no ripple, no browser highlight, focus is a ring only.
 */
export function SegmentNav<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentNavProps<T>) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  )
  const count = options.length

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = (activeIndex + dir + count) % count
    onChange(options[next].id)
    btnRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="relative inline-grid rounded-full border border-line bg-raised p-1"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {/* Sliding accent indicator */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full bg-accent"
        style={{
          top: 4,
          bottom: 4,
          left: 4,
          width: `calc((100% - 8px) / ${count})`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1), width 200ms cubic-bezier(0.2,0.7,0.2,1)',
          boxShadow: 'var(--elev-1)',
        }}
      />

      {options.map((opt, i) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 rounded-full px-5 py-1.5 text-center text-sm font-semibold transition-colors duration-150 ${
              active ? 'text-on-accent' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
