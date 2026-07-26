import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ProductImage } from '../ui/ProductImage'
import { useStore } from '../../context/StoreContext'
import type { Product } from '../../types'

interface ProductDetailModalProps {
  isOpen: boolean
  product: Product | null
  canEdit: boolean
  onEdit: (product: Product) => void
  onClose: () => void
}

export function ProductDetailModal({ isOpen, product, canEdit, onEdit, onClose }: ProductDetailModalProps) {
  const { zones } = useStore()
  if (!product) {
    return <Modal isOpen={isOpen} onClose={onClose} title="Produkt">{null}</Modal>
  }

  const zone = zones.find((z) => z.id === product.zone_id)
  const location = zone?.name ?? 'Nicht platziert'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      footer={
        canEdit ? (
          <>
            <Button variant="ghost" type="button" onClick={onClose}>
              Schließen
            </Button>
            <Button type="button" onClick={() => onEdit(product)}>
              Bearbeiten
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <ProductImage
          name={product.name}
          imageUrl={product.image_url}
          rounded="rounded-lg"
          className="aspect-square w-full"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[13px] font-medium"
            style={{
              background: zone ? 'var(--accent-soft)' : 'var(--surface-inset)',
              color: zone ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {location}
          </span>
          {product.created_by_name && (
            <span className="text-[13px] text-ink-mute">von {product.created_by_name}</span>
          )}
        </div>

        {product.description ? (
          <p className="text-[15px] leading-relaxed text-ink-soft">{product.description}</p>
        ) : (
          <p className="text-[15px] italic text-ink-mute">Keine Beschreibung.</p>
        )}
      </div>
    </Modal>
  )
}
