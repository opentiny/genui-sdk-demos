<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrders } from '../composables'

const route = useRoute()
const { sortedOrders } = useOrders()

const latestOrderId = computed(() => {
  const value = route.query.new
  return typeof value === 'string' ? value : ''
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(amount: number) {
  return `¥${amount.toLocaleString()}`
}
</script>

<template>
  <section class="panel orders">
    <h1 class="section-title">我的订单</h1>
    <p class="section-desc">订单会保存在浏览器本地，刷新后仍可查看。</p>

    <div v-if="sortedOrders.length === 0" class="empty-state orders__empty">
      暂无订单记录。<RouterLink to="/products">去下第一单</RouterLink>
    </div>

    <ul v-else class="orders__list">
      <li
        v-for="order in sortedOrders"
        :key="order.id"
        class="order-card"
        :class="{ 'order-card--new': latestOrderId === order.id }"
      >
        <header class="order-card__head">
          <div>
            <p class="order-card__id">{{ order.id }}</p>
            <p class="order-card__time">{{ formatDate(order.createdAt) }}</p>
          </div>
          <strong>{{ formatPrice(order.totalAmount) }}</strong>
        </header>

        <ul class="order-card__items">
          <li v-for="line in order.lines" :key="line.productId">
            <img :src="line.image" :alt="line.title" />
            <p>
              <span>{{ line.title }}</span>
              <small>{{ line.quantity }} x {{ formatPrice(line.price) }}</small>
            </p>
          </li>
        </ul>

        <p class="order-card__addr">收货信息：{{ order.recipient }}，{{ order.phone }}，{{ order.address }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.orders {
  padding: 22px;
}

.orders__empty {
  margin-top: 16px;
}

.orders__list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.order-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.order-card--new {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px #ede9fe;
}

.order-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.order-card__id {
  margin: 0;
  color: var(--title);
  font-weight: 600;
}

.order-card__time {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.order-card__head strong {
  color: var(--title);
  font-size: 17px;
}

.order-card__items {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.order-card__items li {
  display: flex;
  gap: 10px;
  align-items: center;
}

.order-card__items img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
}

.order-card__items p {
  margin: 0;
  display: grid;
  gap: 3px;
}

.order-card__items span {
  font-size: 14px;
  color: var(--title);
}

.order-card__items small {
  color: var(--muted);
}

.order-card__addr {
  margin: 14px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 13px;
}
</style>
