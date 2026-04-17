<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../types'

const props = defineProps<{
  id: Product['id']
  title: Product['title']
  price: Product['price']
  image: Product['image']
  description: Product['description']
  tags: Product['tags']
  rating: Product['rating']
  ratingCount: Product['ratingCount']
  inStock: Product['inStock']
  badgeText: Product['badgeText']
}>()

const emit = defineEmits<{
  open: [product: Product]
  add: [product: Product]
}>()

const product = computed<Product>(() => ({
  id: props.id,
  title: props.title,
  price: props.price,
  image: props.image,
  description: props.description,
  tags: props.tags,
  rating: props.rating,
  ratingCount: props.ratingCount,
  inStock: props.inStock,
  badgeText: props.badgeText,
}))
</script>

<template>
  <article class="card" @click="emit('open', product)">
    <div class="card__media">
      <img :src="image" :alt="title" loading="lazy" />
      <span v-if="badgeText" class="card__badge">{{ badgeText }}</span>
    </div>
    <div class="card__body">
      <h3 class="card__title">{{ title }}</h3>
      <p class="card__desc">{{ description }}</p>
      <div class="card__meta">
        <span class="card__rating" aria-label="评分">
          ★ {{ rating?.toFixed(1) }}
          <span class="card__rating-count">({{ ratingCount?.toLocaleString() }})</span>
        </span>
        <span v-if="!inStock" class="card__stock card__stock--out">缺货</span>
        <span v-else class="card__stock">有货</span>
      </div>
      <div class="card__footer">
        <span class="card__price">¥{{ price?.toLocaleString() }}</span>
        <button
          type="button"
          class="card__btn"
          :disabled="!inStock"
          @click.stop="emit('add', product)"
        >
          加入购物车
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  text-align: left;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--code-bg);
}

.card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  font-weight: 500;
}

.card__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card__title {
  font-size: 16px;
  margin: 0;
  line-height: 1.35;
  color: var(--text-h);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__desc {
  font-size: 13px;
  line-height: 1.45;
  color: var(--text);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}

.card__rating {
  color: var(--text-h);
}

.card__rating-count {
  color: var(--text);
  font-size: 12px;
}

.card__stock {
  font-size: 12px;
  color: #16a34a;
}

@media (prefers-color-scheme: dark) {
  .card__stock {
    color: #4ade80;
  }
}

.card__stock--out {
  color: #dc2626;
}

@media (prefers-color-scheme: dark) {
  .card__stock--out {
    color: #f87171;
  }
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.card__price {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
}

.card__btn {
  font: inherit;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  transition: border-color 0.2s;
  white-space: nowrap;
}

.card__btn:hover:not(:disabled) {
  border-color: var(--accent-border);
}

.card__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
