/** 与 `sites/web/src/mcp-fetch/mcp-server.ts` 中 ProductSchema 对齐 */
export interface Product {
  id: string
  title: string
  price: number
  image: string
  description: string
  tags: string[]
  rating: number
  ratingCount: number
  inStock: boolean
  badgeText: string
}
