import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { TextField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import * as api from '../../api'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setDisplayName, logout } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(user?.display_name ?? '')
      setNameError(null)
      setCurrentPw('')
      setNewPw('')
      setPwErrors({})
    }
  }, [isOpen, user])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameError(null)
    setSavingName(true)
    try {
      await setDisplayName(name.trim())
      toast('Anzeigename aktualisiert.', 'success')
    } catch (err) {
      if (err instanceof ApiError) setNameError(err.fields?.display_name ?? err.message)
      else setNameError('Speichern fehlgeschlagen.')
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErrors({})
    setSavingPw(true)
    try {
      await api.updatePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      toast('Passwort geändert.', 'success')
    } catch (err) {
      if (err instanceof ApiError) {
        setPwErrors(err.fields ?? { current_password: err.message })
      } else {
        setPwErrors({ current_password: 'Änderung fehlgeschlagen.' })
      }
    } finally {
      setSavingPw(false)
    }
  }

  async function handleLogout() {
    await logout()
    toast('Abgemeldet.')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil">
      <div className="flex flex-col gap-6">
        <section>
          <p className="text-[13px] text-ink-mute">Angemeldet als</p>
          <p className="text-[15px] font-medium text-ink">{user?.email}</p>
        </section>

        <form onSubmit={saveName} className="flex flex-col gap-3">
          <TextField
            label="Anzeigename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />
          <Button type="submit" size="sm" loading={savingName} className="self-start">
            Namen speichern
          </Button>
        </form>

        <div className="h-px bg-line" />

        <form onSubmit={savePassword} className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-ink">Passwort ändern</h3>
          <TextField
            label="Aktuelles Passwort"
            type="password"
            autoComplete="current-password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            error={pwErrors.current_password}
          />
          <TextField
            label="Neues Passwort"
            type="password"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            error={pwErrors.new_password}
            hint="Mindestens 8 Zeichen."
          />
          <Button type="submit" size="sm" variant="secondary" loading={savingPw} className="self-start">
            Passwort ändern
          </Button>
        </form>

        <div className="h-px bg-line" />

        <Button variant="danger" type="button" onClick={handleLogout} block>
          Abmelden
        </Button>
      </div>
    </Modal>
  )
}
