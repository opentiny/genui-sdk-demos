<script setup lang="ts">
import type { Product } from '../types'

defineProps<{
  product: Product | null
}>()

const emit = defineEmits<{
  close: []
  add: [product: Product]
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="product" class="overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal">
        <button type="button" class="modal__close" aria-label="关闭" @click="emit('close')">
          ×
        </button>
        <div class="modal__grid">
          <div class="modal__img-wrap">
            <img :src="product.image" :alt="product.title" />
          </div>
          <div class="modal__info">
            <span v-if="product.badgeText" class="modal__badge">{{ product.badgeText }}</span>
            <h2 class="modal__title">{{ product.title }}</h2>
            <p class="modal__price">¥{{ product.price.toLocaleString() }}</p>
            <p class="modal__desc">{{ product.description }}</p>
            <div class="modal__tags">
              <span v-for="t in product.tags" :key="t" class="tag">{{ t }}</span>
            </div>
            <p class="modal__rating">
              评分 {{ product.rating.toFixed(1) }} · {{ product.ratingCount.toLocaleString() }} 条评价
            </p>
            <button
              type="button"
              class="modal__cta"
              :disabled="!product.inStock"
              @click="emit('add', product)"
            >
              {{ product.inStock ? '加入购物车' : '暂时缺货' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.modal {
  position: relative;
  width: min(920px, 100%);
  max-height: min(90vh, 720px);
  overflow: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: var(--code-bg);
  color: var(--text-h);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  z-index: 1;
}

.modal__close:hover {
  background: var(--social-bg);
}

.modal__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 280px;
}

@media (max-width: 720px) {
  .modal__grid {
    grid-template-columns: 1fr;
  }
}

.modal__img-wrap {
  background: var(--code-bg);
  min-height: 240px;
}

.modal__img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  max-height: 420px;
}

.modal__info {
  padding: 28px 24px 32px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal__badge {
  align-self: flex-start;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.modal__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
}

.modal__price {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-h);
}

.modal__desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text);
}

.modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--social-bg);
  color: var(--text-h);
}

.modal__rating {
  margin: 0;
  font-size: 14px;
  color: var(--text);
}

.modal__cta {
  margin-top: 8px;
  font: inherit;
  font-size: 16px;
  padding: 12px 20px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  transition: border-color 0.2s;
}

.modal__cta:hover:not(:disabled) {
  border-color: var(--accent-border);
}

.modal__cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
