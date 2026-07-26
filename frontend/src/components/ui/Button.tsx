import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  children: ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent font-semibold hover:bg-accent-hi active:scale-[0.98] shadow-e1',
  secondary:
    'bg-raised text-ink ring-1 ring-line hover:ring-line-strong active:scale-[0.98]',
  ghost: 'text-ink-soft hover:bg-surface hover:text-ink',
  danger: 'bg-danger text-white font-semibold hover:bg-danger-hi active:scale-[0.98] shadow-e1',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-sm',
  md: 'h-11 px-5 text-[15px] rounded-md',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[transform,background-color,box-shadow,color] duration-150 disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
