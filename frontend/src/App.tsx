import { useState } from 'react'
import { Header } from './components/Header'
import type { View } from './components/Header'
import { MapView } from './views/MapView'
import { ProductsView } from './views/ProductsView'
import { AuthModal } from './components/modals/AuthModal'
import type { AuthMode } from './components/modals/AuthModal'
import { ProfileModal } from './components/modals/ProfileModal'
import { ProductFormModal } from './components/modals/ProductFormModal'
import { ProductDetailModal } from './components/modals/ProductDetailModal'
import { ConfirmDialog } from './components/modals/ConfirmDialog'
import { useAuth } from './context/AuthContext'
import { useStore } from './context/StoreContext'
import { useToast } from './context/ToastContext'
import type { Product } from './types'

export default function App() {
  const { isAuthenticated } = useAuth()
  const { removeProduct } = useStore()
  const { toast } = useToast()

  const [view, setView] = useState<View>('map')

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [detail, setDetail] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [formProduct, setFormProduct] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const [toDelete, setToDelete] = useState<Product | null>(null)

  function openAuth(mode: AuthMode) {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  function openDetail(product: Product) {
    setDetail(product)
    setDetailOpen(true)
  }

  function openForm(product: Product | null) {
    setFormProduct(product)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await removeProduct(toDelete.id)
      toast('Produkt gelöscht.', 'success')
    } catch {
      toast('Löschen fehlgeschlagen.', 'danger')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-floor text-ink">
      <Header
        view={view}
        onViewChange={setView}
        onLogin={() => openAuth('login')}
        onProfile={() => setProfileOpen(true)}
      />

      <main className="min-h-0 flex-1">
        {view === 'map' ? (
          <MapView onOpenDetail={openDetail} onRequestLogin={() => openAuth('login')} />
        ) : (
          <ProductsView
            onOpenDetail={openDetail}
            onCreate={() => openForm(null)}
            onEdit={(p) => openForm(p)}
            onDelete={(p) => setToDelete(p)}
          />
        )}
      </main>

      {/* Modals — every flow is a modal, never a page redirect. */}
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <ProductFormModal isOpen={formOpen} product={formProduct} onClose={() => setFormOpen(false)} />
      <ProductDetailModal
        isOpen={detailOpen}
        product={detail}
        canEdit={isAuthenticated}
        onEdit={(p) => {
          setDetailOpen(false)
          openForm(p)
        }}
        onClose={() => setDetailOpen(false)}
      />
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Produkt löschen"
        message={`„${toDelete?.name}“ wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
