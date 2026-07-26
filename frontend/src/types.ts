// Shared domain types, mirroring the PHP API (see docs/API.md).

export type ZoneType = 'shelf' | 'window'

export interface Zone {
  id: number
  name: string
  type: ZoneType
  x: number
  y: number
  w: number
  h: number
  sort_order: number
}

export interface Product {
  id: number
  name: string
  description: string | null
  image_url: string | null
  zone_id: number | null
  pos_x: number | null
  pos_y: number | null
  sort_order: number
  created_by: number | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  display_name: string
}

/** The fixed logical canvas every coordinate is expressed against. */
export const CANVAS = { width: 1000, height: 700 } as const

export type ProductSort = 'name' | 'created' | 'updated' | 'zone'
export type SortOrder = 'asc' | 'desc'

export interface ProductInput {
  name: string
  description?: string | null
  image_url?: string | null
  zone_id?: number | null
}

export interface Placement {
  zone_id: number | null
  pos_x: number | null
  pos_y: number | null
}
