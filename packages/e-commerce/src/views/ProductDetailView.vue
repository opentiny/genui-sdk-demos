<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProductById } from '../api'
import { useCart, useCartNotice } from '../composables'
import { MOCK_PRODUCTS } from '../mock'
import type { Product } from '../types'

const route = useRoute()
const router = useRouter()
const { addToCart } = useCart()
const { showCartNotice } = useCartNotice()

const loading = ref(true)
const product = ref<Product | null>(null)

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id !== 'string') {
      product.value = null
      loading.value = false
      return
    }
    loading.value = true
    product.value = await fetchProductById(id)
    loading.value = false
  },
  { immediate: true },
)

const relatedProducts = computed(() => {
  if (!product.value) return []
  return MOCK_PRODUCTS.filter((item) => {
    if (item.id === product.value?.id) return false
    return item.tags.some((tag) => product.value?.tags.includes(tag))
  }).slice(0, 3)
})

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`
}

function addCurrentProduct() {
  if (!product.value) return
  addToCart(product.value, 1)
  showCartNotice(product.value.title)
}

function openOtherProduct(id: string) {
  router.push(`/products/${id}`)
}
</script>

<template>
  <div v-if="loading" class="empty-state">商品详情加载中...</div>

  <section v-else-if="product" class="detail panel">
    <img class="detail__image" :src="product.image" :alt="product.title" />

    <div class="detail__content">
      <p v-if="product.badgeText" class="detail__badge">{{ product.badgeText }}</p>
      <h1 class="section-title">{{ product.title }}</h1>
      <p class="detail__price">{{ formatPrice(product.price) }}</p>
      <p class="section-desc">{{ product.description }}</p>

      <div class="detail__tags">
        <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
      </div>

      <p class="detail__rating">
        评分 {{ product.rating.toFixed(1) }} / 5 · {{ product.ratingCount.toLocaleString() }} 条评价
      </p>

      <div class="detail__actions">
        <button type="button" class="detail__cta" :disabled="!product.inStock" @click="addCurrentProduct">
          {{ product.inStock ? '加入购物车' : '暂时缺货' }}
        </button>
        <RouterLink to="/products" class="detail__link">返回商品列表</RouterLink>
      </div>
    </div>
  </section>

  <section v-if="!loading && product && relatedProducts.length > 0" class="related">
    <h2 class="related__title">你可能还喜欢</h2>
    <div class="related__list">
      <button
        v-for="item in relatedProducts"
        :key="item.id"
        type="button"
        class="related__item"
        @click="openOtherProduct(item.id)"
      >
        <img :src="item.image" :alt="item.title" />
        <div>
          <p>{{ item.title }}</p>
          <span>{{ formatPrice(item.price) }}</span>
        </div>
      </button>
    </div>
  </section>

  <div v-if="!loading && !product" class="empty-state">
    商品不存在或已下架。<RouterLink to="/products">去商品列表看看</RouterLink>
  </div>
</template>

<style scoped>
.detail {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(320px, 48%) 1fr;
}

.detail__image {
  width: 100%;
  height: 100%;
  min-height: 320px;
  object-fit: cover;
  background: #f3f8fc;
}

.detail__content {
  padding: 26px;
}

.detail__badge {
  margin: 0 0 12px;
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #4c1d95;
  background: #ede9fe;
}

.detail__price {
  margin: 10px 0;
  color: var(--title);
  font-size: 28px;
  font-weight: 700;
}

.detail__tags {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail__tags span {
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 10px;
}

.detail__rating {
  margin: 14px 0 0;
  font-size: 14px;
  color: var(--muted);
}

.detail__actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail__cta {
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  cursor: pointer;
}

.detail__cta:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.detail__link {
  color: #6d28d9;
  text-decoration: none;
  font-size: 14px;
}

.related {
  margin-top: 18px;
}

.related__title {
  margin: 0 0 10px;
  color: var(--title);
  font-size: 20px;
}

.related__list {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.related__item {
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  display: flex;
  gap: 10px;
  text-align: left;
}

.related__item img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.related__item p {
  margin: 0;
  color: var(--title);
  font-size: 13px;
}

.related__item span {
  display: inline-block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 920px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
