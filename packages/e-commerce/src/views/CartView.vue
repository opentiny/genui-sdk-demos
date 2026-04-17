<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCart, useOrders } from '../composables'
import type { Order } from '../types'

const router = useRouter()
const { lines, subtotal, totalCount, setQuantity, removeLine, clearCart } = useCart()
const { addOrder, makeOrderId } = useOrders()

const isSubmitting = ref(false)
const freeShippingThreshold = 999

const shippingFee = computed(() => {
  if (subtotal.value === 0 || subtotal.value >= freeShippingThreshold) return 0
  return 12
})

const totalAmount = computed(() => subtotal.value + shippingFee.value)

function increase(productId: string) {
  const line = lines.value.find((item) => item.product.id === productId)
  if (!line) return
  setQuantity(productId, line.quantity + 1)
}

function decrease(productId: string) {
  const line = lines.value.find((item) => item.product.id === productId)
  if (!line) return
  setQuantity(productId, line.quantity - 1)
}

function formatPrice(amount: number) {
  return `¥${amount.toLocaleString()}`
}

async function submitOrder() {
  if (!lines.value.length || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 500)
    })
    const order: Order = {
      id: makeOrderId(),
      createdAt: new Date().toISOString(),
      lines: lines.value.map((line) => ({
        productId: line.product.id,
        title: line.product.title,
        image: line.product.image,
        price: line.product.price,
        quantity: line.quantity,
      })),
      totalAmount: totalAmount.value,
      recipient: '演示用户',
      phone: '138-0000-0000',
      address: '上海市浦东新区世纪大道 100 号',
    }
    addOrder(order)
    clearCart()
    await router.push(`/orders?new=${order.id}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="cart-page">
    <section class="panel cart-lines">
      <h1 class="section-title">购物车</h1>
      <p class="section-desc">共 {{ totalCount }} 件商品，支持在此页调整数量。</p>

      <div v-if="lines.length === 0" class="empty-state cart-lines__empty">
        购物车还是空的。<RouterLink to="/products">去选购商品</RouterLink>
      </div>

      <ul v-else class="cart-lines__list">
        <li v-for="line in lines" :key="line.product.id" class="line">
          <img :src="line.product.image" :alt="line.product.title" />
          <div class="line__main">
            <p class="line__title">{{ line.product.title }}</p>
            <p class="line__price">{{ formatPrice(line.product.price) }}</p>
            <div class="line__actions">
              <button type="button" @click="decrease(line.product.id)">-</button>
              <span>{{ line.quantity }}</span>
              <button type="button" @click="increase(line.product.id)">+</button>
              <button type="button" class="line__remove" @click="removeLine(line.product.id)">移除</button>
            </div>
          </div>
          <strong class="line__total">{{ formatPrice(line.product.price * line.quantity) }}</strong>
        </li>
      </ul>
    </section>

    <aside class="panel summary">
      <h2>订单摘要</h2>
      <p><span>商品金额</span><strong>{{ formatPrice(subtotal) }}</strong></p>
      <p><span>运费</span><strong>{{ shippingFee === 0 ? '免运费' : formatPrice(shippingFee) }}</strong></p>
      <p class="summary__total"><span>应付总额</span><strong>{{ formatPrice(totalAmount) }}</strong></p>

      <button type="button" class="summary__checkout" :disabled="lines.length === 0 || isSubmitting" @click="submitOrder">
        {{ isSubmitting ? '正在提交...' : '提交模拟订单' }}
      </button>
      <RouterLink to="/products" class="summary__continue">继续购物</RouterLink>
    </aside>
  </div>
</template>

<style scoped>
.cart-page {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: flex-start;
}

.cart-lines {
  padding: 22px;
}

.cart-lines__empty {
  margin-top: 16px;
}

.cart-lines__list {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.line {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 12px;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  align-items: center;
}

.line img {
  width: 92px;
  height: 76px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f8fc;
}

.line__title {
  margin: 0;
  color: var(--title);
  font-size: 14px;
}

.line__price {
  margin: 5px 0 8px;
  color: var(--muted);
  font-size: 13px;
}

.line__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.line__actions button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.line__actions span {
  min-width: 22px;
  text-align: center;
  font-size: 14px;
  color: var(--title);
}

.line__actions .line__remove {
  width: auto;
  padding: 0 8px;
  font-size: 12px;
}

.line__total {
  color: var(--title);
  font-size: 15px;
}

.summary {
  padding: 20px;
  position: sticky;
  top: 84px;
}

.summary h2 {
  margin: 0 0 14px;
  color: var(--title);
  font-size: 20px;
}

.summary p {
  margin: 0;
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary span {
  color: var(--muted);
}

.summary strong {
  color: var(--title);
}

.summary__total {
  border-top: 1px solid var(--line);
  margin-top: 4px;
  padding-top: 12px;
}

.summary__checkout {
  width: 100%;
  margin-top: 14px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  padding: 11px 14px;
  font-weight: 600;
  cursor: pointer;
}

.summary__checkout:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.summary__continue {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: #6d28d9;
  text-decoration: none;
}

@media (max-width: 980px) {
  .cart-page {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }
}

@media (max-width: 640px) {
  .line {
    grid-template-columns: 1fr;
  }

  .line img {
    width: 100%;
    height: 180px;
  }
}
</style>
