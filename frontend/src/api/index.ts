// Typed API surface. One function per endpoint (see docs/API.md).
import { request } from './client'
import type {
  Placement,
  Product,
  ProductInput,
  ProductSort,
  SortOrder,
  User,
  Zone,
} from '../types'

// --- Zones ---
export async function fetchZones(): Promise<Zone[]> {
  const { zones } = await request<{ zones: Zone[] }>('GET', '/api/zones')
  return zones
}

// --- Products ---
export interface ProductQuery {
  sort?: ProductSort
  order?: SortOrder
  search?: string
}

export async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams()
  if (query.sort) params.set('sort', query.sort)
  if (query.order) params.set('order', query.order)
  if (query.search) params.set('search', query.search)
  const qs = params.toString()
  const { products } = await request<{ products: Product[] }>(
    'GET',
    `/api/products${qs ? `?${qs}` : ''}`,
  )
  return products
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { product } = await request<{ product: Product }>('POST', '/api/products', input)
  return product
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  const { product } = await request<{ product: Product }>('PATCH', `/api/products/${id}`, input)
  return product
}

export async function deleteProduct(id: number): Promise<void> {
  await request<{ ok: true }>('DELETE', `/api/products/${id}`)
}

export async function updatePlacement(id: number, placement: Placement): Promise<Product> {
  const { product } = await request<{ product: Product }>(
    'PATCH',
    `/api/products/${id}/placement`,
    placement,
  )
  return product
}

export async function reorderProducts(items: { id: number; sort_order: number }[]): Promise<void> {
  await request<{ ok: true }>('PATCH', '/api/products/reorder', { items })
}

// --- Auth ---
export interface AuthResult {
  token: string
  user: User
}

export async function register(
  email: string,
  display_name: string,
  password: string,
): Promise<AuthResult> {
  return request<AuthResult>('POST', '/api/auth/register', { email, display_name, password })
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('POST', '/api/auth/login', { email, password })
}

export async function fetchMe(): Promise<User> {
  const { user } = await request<{ user: User }>('GET', '/api/auth/me')
  return user
}

export async function logout(): Promise<void> {
  await request<{ ok: true }>('POST', '/api/auth/logout')
}

// --- Account ---
export async function updateDisplayName(display_name: string): Promise<User> {
  const { user } = await request<{ user: User }>('PATCH', '/api/me', { display_name })
  return user
}

export async function updatePassword(
  current_password: string,
  new_password: string,
): Promise<void> {
  await request<{ ok: true }>('PATCH', '/api/me/password', { current_password, new_password })
}
