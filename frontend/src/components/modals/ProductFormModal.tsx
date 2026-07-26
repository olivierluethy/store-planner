import { useEffect, useRef, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { checkmarkCircle, warningOutline } from 'ionicons/icons'
import { Modal } from '../ui/Modal'
import { TextField, TextAreaField } from '../ui/TextField'
import { Button } from '../ui/Button'
import { ProductImage } from '../ui/ProductImage'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { ApiError } from '../../api/client'
import type { Product } from '../../types'

interface ProductFormModalProps {
  isOpen: boolean
  product: Product | null // null → create mode
  onClose: () => void
}

type ImgStatus = 'idle' | 'loading' | 'ok' | 'error'

export function ProductFormModal({ isOpen, product, onClose }: ProductFormModalProps) {
  const { zones, createProduct, editProduct } = useStore()
  const { toast } = useToast()
  const isEdit = product !== null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [zoneId, setZoneId] = useState<string>('')
  const [imgStatus, setImgStatus] = useState<ImgStatus>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const probeRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setName(product?.name ?? '')
    setDescription(product?.description ?? '')
    setImageUrl(product?.image_url ?? '')
    setZoneId('')
    setErrors({})
    setFormError(null)
    setLoading(false)
    setImgStatus(product?.image_url ? 'loading' : 'idle')
    if (product?.image_url) probe(product.image_url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product])

  function probe(url: string) {
    const trimmed = url.trim()
    if (!trimmed) {
      setImgStatus('idle')
      return
    }
    setImgStatus('loading')
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      if (probeRef.current === img) setImgStatus('ok')
    }
    img.onerror = () => {
      if (probeRef.current === img) setImgStatus('error')
    }
    img.src = trimmed
    probeRef.current = img
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setLoading(true)
    try {
      if (isEdit && product) {
        await editProduct(product.id, {
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
        })
        toast('Produkt aktualisiert.', 'success')
      } else {
        await createProduct({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          zone_id: zoneId ? Number(zoneId) : null,
        })
        toast('Produkt erstellt.', 'success')
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields)
        else setFormError(err.message)
      } else {
        setFormError('Speichern fehlgeschlagen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form="product-form" loading={loading}>
            {isEdit ? 'Speichern' : 'Erstellen'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="z. B. Bio-Äpfel"
        />

        <TextAreaField
          label="Beschreibung (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Kurze Beschreibung des Produkts"
        />

        <div>
          <TextField
            label="Bild-URL (optional)"
            type="url"
            inputMode="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={(e) => probe(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text')
              if (pasted) window.setTimeout(() => probe(pasted), 0)
            }}
            error={errors.image_url}
            placeholder="https://…/bild.jpg"
          />
          <ImagePreview status={imgStatus} name={name} url={imageUrl} />
        </div>

        {!isEdit && (
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
              Platzierung (optional)
            </span>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full rounded-sm bg-inset px-3 py-2.5 text-[15px] text-ink outline-none ring-1 ring-line focus:ring-2 focus:ring-[color:var(--accent-ring)]"
            >
              <option value="">Nicht platziert (Ablage)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {formError && (
          <p className="rounded-sm bg-[color:var(--danger-soft)] px-3 py-2 text-[13px] text-danger">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}

function ImagePreview({ status, name, url }: { status: ImgStatus; name: string; url: string }) {
  if (status === 'idle') return null
  return (
    <div className="mt-3 flex items-center gap-3 rounded-md bg-inset p-3 ring-1 ring-line">
      {status === 'ok' ? (
        <ProductImage name={name || 'Bild'} imageUrl={url.trim()} className="h-14 w-14" />
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-md bg-raised">
          {status === 'loading' ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-mute border-t-transparent" />
          ) : (
            <IonIcon icon={warningOutline} className="text-xl text-danger" />
          )}
        </div>
      )}
      <div className="min-w-0 text-[13px]">
        {status === 'loading' && <p className="text-ink-soft">Bild wird geladen…</p>}
        {status === 'ok' && (
          <p className="flex items-center gap-1.5 font-medium text-success">
            <IonIcon icon={checkmarkCircle} /> Bild hinzugefügt
          </p>
        )}
        {status === 'error' && (
          <p className="text-danger">
            Bild konnte nicht geladen werden. Du kannst die URL trotzdem speichern.
          </p>
        )}
      </div>
    </div>
  )
}
