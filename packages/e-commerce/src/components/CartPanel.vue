<script setup lang="ts">
import { computed } from 'vue'
import type { CartLine } from '../composables'

const props = defineProps<{
  open: boolean
  lines: CartLine[]
}>()

const emit = defineEmits<{
  close: []
  inc: [productId: string]
  dec: [productId: string]
  remove: [productId: string]
  checkout: []
}>()

const subtotal = computed(() =>
  props.lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="emit('close')" />
    <aside
      class="drawer"
      :class="{ 'drawer--open': open }"
      aria-label="购物车"
    >
      <div class="drawer__head">
        <h2 class="drawer__title">购物车</h2>
        <button type="button" class="drawer__close" aria-label="关闭" @click="emit('close')">
          ×
        </button>
      </div>
      <div v-if="lines.length === 0" class="drawer__empty">购物车是空的，去逛逛吧。</div>
      <ul v-else class="drawer__list">
        <li v-for="line in lines" :key="line.product.id" class="line">
          <img :src="line.product.image" alt="" class="line__img" />
          <div class="line__info">
            <p class="line__title">{{ line.product.title }}</p>
            <p class="line__price">¥{{ line.product.price.toLocaleString() }}</p>
            <div class="line__qty">
              <button type="button" class="qty-btn" @click="emit('dec', line.product.id)">−</button>
              <span class="qty-val">{{ line.quantity }}</span>
              <button type="button" class="qty-btn" @click="emit('inc', line.product.id)">+</button>
              <button type="button" class="line__remove" @click="emit('remove', line.product.id)">
                移除
              </button>
            </div>
          </div>
        </li>
      </ul>
      <div v-if="lines.length" class="drawer__foot">
        <p class="drawer__sum">
          合计 <strong>¥{{ subtotal.toLocaleString() }}</strong>
        </p>
        <button type="button" class="drawer__checkout" @click="emit('checkout')">
          模拟结算（Demo）
        </button>
      </div>
    </aside>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.35);
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 70;
  width: min(400px, 100vw);
  height: 100%;
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  box-sizing: border-box;
}

.drawer--open {
  transform: translateX(0);
}

.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.drawer__title {
  margin: 0;
  font-size: 18px;
}

.drawer__close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--code-bg);
  color: var(--text-h);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.drawer__empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--text);
}

.drawer__list {
  list-style: none;
  margin: 0;
  padding: 12px 16px;
  overflow: auto;
  flex: 1;
}

.line {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.line:last-child {
  border-bottom: none;
}

.line__img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--code-bg);
  flex-shrink: 0;
}

.line__info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.line__title {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.35;
  color: var(--text-h);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line__price {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
}

.line__qty {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-h);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.qty-val {
  min-width: 24px;
  text-align: center;
  font-size: 14px;
}

.line__remove {
  margin-left: auto;
  font-size: 13px;
  border: none;
  background: none;
  color: var(--text);
  text-decoration: underline;
  cursor: pointer;
}

.drawer__foot {
  padding: 16px 18px 24px;
  border-top: 1px solid var(--border);
}

.drawer__sum {
  margin: 0 0 12px;
  text-align: left;
  font-size: 15px;
}

.drawer__checkout {
  width: 100%;
  font: inherit;
  font-size: 15px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
}

.drawer__checkout:hover {
  border-color: var(--accent-border);
}
</style>
