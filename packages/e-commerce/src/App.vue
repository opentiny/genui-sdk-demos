<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useCart, useCartNotice } from './composables'

const { totalCount } = useCart()
const { cartNoticeVisible, cartNoticeTitle, closeCartNotice } = useCartNotice()
const currentYear = new Date().getFullYear()
const assistantOpen = ref(false)

const AIAssistantDrawer = defineAsyncComponent(
  () => import('./components/AIAssistantDrawer.vue'),
)
</script>

<template>
  <div class="shell">
    <header class="shell__header">
      <RouterLink to="/" class="brand">
        <span class="brand__mark" aria-hidden="true">◆</span>
        云商城
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink to="/" class="nav__item">首页</RouterLink>
        <RouterLink to="/products" class="nav__item">商品</RouterLink>
        <RouterLink to="/orders" class="nav__item">订单</RouterLink>
      </nav>

      <RouterLink to="/cart" class="cart-link">
        购物车
        <span v-if="totalCount > 0" class="cart-link__badge">{{ totalCount }}</span>
      </RouterLink>
    </header>

    <main class="shell__main">
      <RouterView />
    </main>

    <footer class="shell__footer">© {{ currentYear }} Nebula Mart Demo</footer>

    <button
      class="assistant-fab"
      type="button"
      aria-label="打开 AI 导购助手"
      @click="assistantOpen = true"
    >
      <span class="assistant-fab__dot">AI</span>
      <span class="assistant-fab__text">
        导购助手
        <small v-if="totalCount > 0">{{ totalCount }} 件待结算</small>
      </span>
    </button>

    <AIAssistantDrawer
      v-if="assistantOpen"
      v-model="assistantOpen"
    />

    <Teleport to="body">
      <Transition name="notice-slide">
        <div v-if="cartNoticeVisible" class="mini-notice" role="status" aria-live="polite">
          <div class="mini-notice__icon">✓</div>
          <div class="mini-notice__main">
            <h3 class="mini-notice__title">已加入购物车</h3>
            <p class="mini-notice__desc">{{ cartNoticeTitle }}</p>
          </div>
          <div class="mini-notice__actions">
            <RouterLink to="/cart" class="mini-notice__btn mini-notice__btn--primary" @click="closeCartNotice">
              去购物车
            </RouterLink>
            <button type="button" class="mini-notice__btn" @click="closeCartNotice">
              继续浏览
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.shell__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(10px);
  background: rgba(252, 250, 255, 0.95);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--title);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.brand__mark {
  color: var(--accent);
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
}

.nav__item {
  text-decoration: none;
  color: var(--muted);
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav__item:hover,
.nav__item.router-link-active {
  color: var(--title);
  background: var(--accent-soft);
}

.cart-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #3b1e6d;
  background: linear-gradient(135deg, #e9ddff 0%, #dbd7ff 100%);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #ccb8ff;
}

.cart-link__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #6d28d9;
  color: #fff;
  font-size: 12px;
}

.shell__main {
  flex: 1;
  padding: 20px;
}

.shell__footer {
  border-top: 1px solid var(--line);
  padding: 14px 20px 18px;
  font-size: 12px;
  color: var(--muted);
}

.assistant-fab {
  position: fixed;
  right: 18px;
  bottom: 20px;
  z-index: 72;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: #fff;
  min-height: 52px;
  padding: 8px 14px 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 24px rgba(77, 46, 141, 0.28);
  cursor: pointer;
}

.assistant-fab__dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.assistant-fab__text {
  display: grid;
  text-align: left;
  gap: 1px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.assistant-fab__text small {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.88;
}

.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.notice-slide-enter-from,
.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.mini-notice {
  position: fixed;
  top: 88px;
  right: 20px;
  z-index: 80;
  width: min(360px, calc(100vw - 24px));
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #d9c9ff;
  box-shadow: 0 10px 28px rgba(66, 35, 125, 0.18);
  background: #ffffff;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px 12px;
  align-items: center;
}

.mini-notice__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  line-height: 1;
  color: #fff;
  background: #7c3aed;
}

.mini-notice__main {
  min-width: 0;
}

.mini-notice__title {
  margin: 0;
  color: #22123f;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.mini-notice__desc {
  margin: 3px 0 0;
  color: #7a6f93;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-notice__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.mini-notice__btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #d8cbfa;
  text-decoration: none;
  background: #fff;
  color: #5f4a87;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mini-notice__btn--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: #fff;
  font-weight: 600;
}

@media (max-width: 760px) {
  .shell__header {
    flex-wrap: wrap;
  }

  .nav {
    order: 3;
    width: 100%;
    margin-left: 0;
  }

  .assistant-fab {
    right: 12px;
    bottom: 14px;
  }

  .assistant-fab__text small {
    display: none;
  }

  .mini-notice {
    top: auto;
    right: 12px;
    bottom: 14px;
    width: calc(100vw - 24px);
  }
}
</style>
