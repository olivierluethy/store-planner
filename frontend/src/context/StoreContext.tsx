import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Placement, Product, ProductInput, Zone } from '../types'
import * as api from '../api'

interface StoreContextValue {
  zones: Zone[]
  products: Product[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  placeProduct: (id: number, placement: Placement) => Promise<void>
  createProduct: (input: ProductInput) => Promise<Product>
  editProduct: (id: number, input: Partial<ProductInput>) => Promise<Product>
  removeProduct: (id: number) => Promise<void>
  reorder: (ordered: Product[]) => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mirror of products for capturing pre-mutation snapshots (optimistic rollback).
  const productsRef = useRef<Product[]>([])
  productsRef.current = products

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [z, p] = await Promise.all([api.fetchZones(), api.fetchProducts()])
      setZones(z)
      setProducts(p)
    } catch {
      setError('Der Ladenplan konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const placeProduct = useCallback(async (id: number, placement: Placement) => {
    const snapshot = productsRef.current
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...placement } : p)))
    try {
      const updated = await api.updatePlacement(id, placement)
      setProducts((list) => list.map((p) => (p.id === id ? updated : p)))
    } catch (e) {
      setProducts(snapshot)
      throw e
    }
  }, [])

  const createProduct = useCallback(async (input: ProductInput) => {
    const created = await api.createProduct(input)
    setProducts((list) => [...list, created])
    return created
  }, [])

  const editProduct = useCallback(async (id: number, input: Partial<ProductInput>) => {
    const updated = await api.updateProduct(id, input)
    setProducts((list) => list.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const removeProduct = useCallback(async (id: number) => {
    const snapshot = productsRef.current
    setProducts((list) => list.filter((p) => p.id !== id))
    try {
      await api.deleteProduct(id)
    } catch (e) {
      setProducts(snapshot)
      throw e
    }
  }, [])

  const reorder = useCallback(async (ordered: Product[]) => {
    const snapshot = productsRef.current
    const withOrder = ordered.map((p, i) => ({ ...p, sort_order: i + 1 }))
    // Keep any products not in the reordered subset (e.g. filtered out) intact.
    const ids = new Set(withOrder.map((p) => p.id))
    setProducts((list) => [...withOrder, ...list.filter((p) => !ids.has(p.id))])
    try {
      await api.reorderProducts(withOrder.map((p) => ({ id: p.id, sort_order: p.sort_order })))
    } catch (e) {
      setProducts(snapshot)
      throw e
    }
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({
      zones,
      products,
      loading,
      error,
      reload,
      placeProduct,
      createProduct,
      editProduct,
      removeProduct,
      reorder,
    }),
    [zones, products, loading, error, reload, placeProduct, createProduct, editProduct, removeProduct, reorder],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
