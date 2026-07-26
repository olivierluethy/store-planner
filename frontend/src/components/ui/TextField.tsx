import { useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseProps {
  label: string
  error?: string | null
  hint?: string
}

const fieldBase =
  'w-full rounded-sm bg-inset px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-mute outline-none ring-1 transition-[box-shadow,border-color] duration-150'

function ringClass(error?: string | null): string {
  return error
    ? 'ring-danger bg-[color:var(--danger-soft)] focus:ring-danger'
    : 'ring-line focus:ring-2 focus:ring-[color:var(--accent-ring)]'
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, error, hint, className = '', id, ...rest }: InputProps) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <input id={fieldId} className={`${fieldBase} ${ringClass(error)}`} {...rest} />
      <FieldMessage error={error} hint={hint} />
    </div>
  )
}

type AreaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextAreaField({ label, error, hint, className = '', id, ...rest }: AreaProps) {
  const generated = useId()
  const fieldId = id ?? generated
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <textarea
        id={fieldId}
        className={`${fieldBase} min-h-[84px] resize-y leading-relaxed ${ringClass(error)}`}
        {...rest}
      />
      <FieldMessage error={error} hint={hint} />
    </div>
  )
}

function FieldMessage({ error, hint }: { error?: string | null; hint?: string }) {
  if (error) return <p className="mt-1.5 text-[13px] text-danger">{error}</p>
  if (hint) return <p className="mt-1.5 text-[13px] text-ink-mute">{hint}</p>
  return null
}
