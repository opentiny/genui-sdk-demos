import { computed, ref, watch } from 'vue'
import type { Order } from '../types'

const STORAGE_KEY = 'ecommerce-demo-orders-v1'

function loadFromStorage(): Order[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as Order[]
  } catch {
    return []
  }
}

const orders = ref<Order[]>(loadFromStorage())

watch(
  orders,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

function makeOrderId() {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `EC${t}${r}`.toUpperCase()
}

export function useOrders() {
  const sorted = computed(() =>
    [...orders.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  )

  function addOrder(order: Order) {
    orders.value = [order, ...orders.value]
  }

  function getById(id: string): Order | undefined {
    return orders.value.find((o) => o.id === id)
  }

  return {
    orders,
    sortedOrders: sorted,
    addOrder,
    getById,
    makeOrderId,
  }
}
