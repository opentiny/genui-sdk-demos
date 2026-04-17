<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllProducts } from '../api'
import { ProductCard } from '../components'
import { useCart, useCartNotice } from '../composables'
import type { Product } from '../types'

const router = useRouter()
const { addToCart } = useCart()
const { showCartNotice } = useCartNotice()

const loading = ref(true)
const allProducts = ref<Product[]>([])
const keyword = ref('')
const activeTag = ref('全部')

onMounted(async () => {
  try {
    allProducts.value = await fetchAllProducts()
  } finally {
    loading.value = false
  }
})

const tags = computed(() => {
  const items = new Set<string>()
  for (const product of allProducts.value) {
    for (const tag of product.tags) {
      items.add(tag)
    }
  }
  return ['全部', ...items]
})

const filteredProducts = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()
  return allProducts.value.filter((product) => {
    const hitKeyword =
      !normalizedKeyword ||
      product.title.toLowerCase().includes(normalizedKeyword) ||
      product.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
    const hitTag = activeTag.value === '全部' || product.tags.includes(activeTag.value)
    return hitKeyword && hitTag
  })
})

function openProduct(product: Product) {
  router.push(`/products/${product.id}`)
}

function addProduct(product: Product) {
  addToCart(product, 1)
  showCartNotice(product.title)
}
</script>

<template>
  <section class="panel products-header">
    <div>
      <h1 class="section-title">商品列表</h1>
      <p class="section-desc">支持关键词和标签筛选，点击卡片可进入详情页。</p>
    </div>

    <div class="products-header__controls">
      <input
        v-model="keyword"
        type="search"
        class="products-header__search"
        placeholder="搜索商品或标签"
      />
      <span class="products-header__count">共 {{ filteredProducts.length }} 件</span>
    </div>
  </section>

  <div class="tag-row">
    <button
      v-for="tag in tags"
      :key="tag"
      type="button"
      class="tag-chip"
      :class="{ 'tag-chip--active': tag === activeTag }"
      @click="activeTag = tag"
    >
      {{ tag }}
    </button>
  </div>

  <div v-if="loading" class="empty-state">商品加载中...</div>
  <div v-else-if="filteredProducts.length === 0" class="empty-state">没有匹配结果，换个关键词试试。</div>
  <div v-else class="product-grid">
    <ProductCard
      v-for="product in filteredProducts"
      :key="product.id"
      :id="product.id"
      :title="product.title"
      :price="product.price"
      :image="product.image"
      :description="product.description"
      :tags="product.tags"
      :rating="product.rating"
      :rating-count="product.ratingCount"
      :in-stock="product.inStock"
      :badge-text="product.badgeText"
      @open="openProduct"
      @add="addProduct"
    />
  </div>
</template>

<style scoped>
.products-header {
  padding: 22px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
}

.products-header__controls {
  min-width: 280px;
  display: grid;
  justify-items: end;
  gap: 8px;
}

.products-header__search {
  width: 100%;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--title);
  border-radius: 10px;
  padding: 9px 12px;
  outline: none;
}

.products-header__search:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px #ede9fe;
}

.products-header__count {
  font-size: 13px;
  color: var(--muted);
}

.tag-row {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
}

.tag-chip--active {
  border-color: #8b5cf6;
  color: #4c1d95;
  background: #ede9fe;
}

@media (max-width: 880px) {
  .products-header {
    flex-direction: column;
    align-items: stretch;
  }

  .products-header__controls {
    min-width: 0;
    justify-items: stretch;
  }
}
</style>
