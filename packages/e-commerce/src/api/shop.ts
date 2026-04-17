import type { Product } from '../types'
import { MOCK_PRODUCTS } from '../mock'

const normalizeKeyword = (keyword: string) => keyword.trim().toLowerCase()

/** 模拟异步请求延迟 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function fetchAllProducts(): Promise<Product[]> {
  await delay(120)
  return [...MOCK_PRODUCTS]
}

export async function searchProducts(keyword: string): Promise<Product[]> {
  await delay(150)
  const k = normalizeKeyword(keyword)
  if (!k) return [...MOCK_PRODUCTS]
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.id.toLowerCase().includes(k) ||
      p.title.toLowerCase().includes(k) ||
      p.tags.some((t) => t.toLowerCase().includes(k)),
  ).slice(0, 12)
}

export async function fetchProductById(id: string): Promise<Product | null> {
  await delay(80)
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
}
