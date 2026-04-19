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
  const terms = normalizeKeyword(keyword).split(/\s+/).filter(Boolean)
  if (!terms.length) return [...MOCK_PRODUCTS]
  return MOCK_PRODUCTS.filter(
    (p) =>
      terms.some(
        (term) =>
          p.id.toLowerCase().includes(term) ||
          p.title.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term)),
      ),
  ).slice(0, 12)
}

export async function fetchProductById(id: string): Promise<Product | null> {
  await delay(80)
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
}
