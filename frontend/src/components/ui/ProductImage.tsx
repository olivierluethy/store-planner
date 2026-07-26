import { useEffect, useState } from 'react'

interface ProductImageProps {
  name: string
  imageUrl: string | null
  /** Extra classes for the wrapper (sizing, radius). */
  className?: string
  rounded?: string
}

/** Deterministic hue from the name so a product's fallback tile stays stable. */
function hueFromName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 360
  }
  return h
}

/**
 * Renders a product's image, falling back to a generated initial-letter tile
 * when there is no URL or the image fails to load (styleguide §9).
 */
export function ProductImage({ name, imageUrl, className = '', rounded = 'rounded-md' }: ProductImageProps) {
  const [errored, setErrored] = useState(false)

  // Reset the error state if the URL changes (e.g. after an edit).
  useEffect(() => {
    setErrored(false)
  }, [imageUrl])

  const showFallback = !imageUrl || errored

  if (showFallback) {
    const hue = hueFromName(name || '?')
    const initial = (name.trim()[0] ?? '?').toUpperCase()
    return (
      <div
        className={`grid place-items-center overflow-hidden ${rounded} ${className}`}
        style={{
          background: `linear-gradient(150deg, hsl(${hue} 26% 20%), hsl(${hue} 24% 13%))`,
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
        aria-hidden="true"
      >
        <span
          className="font-semibold text-ink-soft"
          style={{ fontSize: 'min(46%, 2.4rem)', lineHeight: 1 }}
        >
          {initial}
        </span>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden ${rounded} ${className}`}>
      <img
        src={imageUrl}
        alt={name}
        referrerPolicy="no-referrer"
        loading="lazy"
        draggable={false}
        onError={() => setErrored(true)}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
