import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'

export type AuthMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
}

export function AuthModal({ isOpen, mode, onClose, onModeChange }: AuthModalProps) {
  const { login, register } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset the form whenever the modal opens or switches mode.
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setDisplayName('')
      setPassword('')
      setErrors({})
      setFormError(null)
      setLoading(false)
    }
  }, [isOpen, mode])

  const isRegister = mode === 'register'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setLoading(true)
    try {
      if (isRegister) {
        await register(email.trim(), displayName.trim(), password)
        toast('Konto erstellt. Willkommen!', 'success')
      } else {
        await login(email.trim(), password)
        toast('Angemeldet.', 'success')
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields)
        else setFormError(err.message)
      } else {
        setFormError('Etwas ist schiefgelaufen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRegister ? 'Konto erstellen' : 'Anmelden'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="E-Mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="du@beispiel.de"
        />

        {isRegister && (
          <TextField
            label="Anzeigename"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.display_name}
            placeholder="Wie sollen wir dich nennen?"
          />
        )}

        <TextField
          label="Passwort"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={isRegister ? 'Mindestens 8 Zeichen.' : undefined}
          placeholder="••••••••"
        />

        {formError && (
          <p className="rounded-sm bg-[color:var(--danger-soft)] px-3 py-2 text-[13px] text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" block loading={loading}>
          {isRegister ? 'Konto erstellen' : 'Anmelden'}
        </Button>

        <p className="text-center text-sm text-ink-soft">
          {isRegister ? 'Schon ein Konto?' : 'Noch kein Konto?'}{' '}
          <button
            type="button"
            className="font-semibold text-accent hover:text-accent-hi"
            onClick={() => onModeChange(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Anmelden' : 'Jetzt registrieren'}
          </button>
        </p>
      </form>
    </Modal>
  )
}
