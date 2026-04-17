import { computed, ref, watch } from 'vue'
import type { Product } from '../types'

export interface CartLine {
  product: Product
  quantity: number
}

const STORAGE_KEY = 'ecommerce-demo-cart-v2'

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.title === 'string' &&
    typeof p.price === 'number' &&
    typeof p.image === 'string' &&
    typeof p.description === 'string' &&
    Array.isArray(p.tags) &&
    typeof p.rating === 'number' &&
    typeof p.ratingCount === 'number' &&
    typeof p.inStock === 'boolean' &&
    typeof p.badgeText === 'string'
  )
}

function loadFromStorage(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartLine => {
      if (!item || typeof item !== 'object') return false
      const line = item as Record<string, unknown>
      return isProduct(line.product) && typeof line.quantity === 'number' && line.quantity > 0
    })
  } catch {
    return []
  }
}

const lines = ref<CartLine[]>(loadFromStorage())

if (typeof window !== 'undefined') {
  watch(
    lines,
    (value) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        /* ignore localStorage errors */
      }
    },
    { deep: true },
  )
}

export function useCart() {
  const totalCount = computed(() =>
    lines.value.reduce((n, l) => n + l.quantity, 0),
  )

  const subtotal = computed(() =>
    lines.value.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
  )

  function addToCart(product: Product, qty = 1) {
    if (!product.inStock) return
    const i = lines.value.findIndex((l) => l.product.id === product.id)
    if (i >= 0) {
      const next = [...lines.value]
      next[i] = { ...next[i], quantity: next[i].quantity + qty }
      lines.value = next
    } else {
      lines.value = [...lines.value, { product, quantity: qty }]
    }
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      lines.value = lines.value.filter((l) => l.product.id !== productId)
      return
    }
    const i = lines.value.findIndex((l) => l.product.id === productId)
    if (i < 0) return
    const next = [...lines.value]
    next[i] = { ...next[i], quantity }
    lines.value = next
  }

  function removeLine(productId: string) {
    lines.value = lines.value.filter((l) => l.product.id !== productId)
  }

  function clearCart() {
    lines.value = []
  }

  return {
    lines,
    totalCount,
    subtotal,
    addToCart,
    setQuantity,
    removeLine,
    clearCart,
  }
}
