<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { useRouter } from 'vue-router'
import { GenuiChat, GenuiConfigProvider } from '@opentiny/genui-sdk-vue'
import { useCart, useCartNotice } from '../composables'
import type { Product } from '../types'
import { createCustomActions } from '../genui/chat/custom-actions'
import { customComponents } from '../genui/chat/custom-components'
import { createMcpOpenAICustomFetch } from '../genui/mcp/custom-fetch'

const router = useRouter()
const { addToCart } = useCart()
const { showCartNotice } = useCartNotice()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

type GenuiChatExposed = ComponentPublicInstance & {
  handleNewConversation: () => void
}

const chatRef = ref<GenuiChatExposed | null>(null)
const theme = ref<'dark' | 'lite' | 'light'>('light')
const model = ref(import.meta.env.VITE_GENUI_MODEL || 'deepseek-v3.2')
const temperature = ref(0)

const chatConfig = {
  addToolCallContext: true,
  showThinkingResult: true,
}

const chatUrl = import.meta.env.VITE_CHAT_COMPLETIONS_URL || 'http://localhost:3100/chat/completions'
const customFetch = createMcpOpenAICustomFetch({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'sk-trial',
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'http://localhost:3100',
  defaultModel: model.value,
  maxToolSteps: 20,
})

function closeDrawer() {
  emit('update:modelValue', false)
}

function startNewConversation() {
  chatRef.value?.handleNewConversation()
}

function onAddProduct(product: Product) {
  addToCart(product, 1)
  showCartNotice(product.title)
}

const customActions = computed(() =>
  createCustomActions({
    addProduct: onAddProduct,
    openProduct: (id) => {
      closeDrawer()
      router.push(`/products/${id}`)
    },
    openCart: () => {
      closeDrawer()
      router.push('/cart')
    },
  }),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue" class="assistant-layer" @click.self="closeDrawer">
        <aside class="assistant-drawer" aria-label="AI 导购助手">
          <header class="assistant-drawer__header">
            <div>
              <h2>AI 导购助手</h2>
            </div>
            <div class="assistant-drawer__actions" role="toolbar" aria-label="助手操作">
              <button type="button" class="assistant-drawer__action" @click="startNewConversation">
                新建对话
              </button>
              <button type="button" class="assistant-drawer__close" @click="closeDrawer">关闭</button>
            </div>
          </header>

          <section class="assistant-drawer__content">
            <div class="assistant-chat">
              <GenuiConfigProvider :theme="theme">
                <GenuiChat
                  ref="chatRef"
                  :url="chatUrl"
                  :customFetch="customFetch"
                  :customComponents="customComponents"
                  :customActions="customActions"
                  :model="model"
                  :temperature="temperature"
                  :chat-config="chatConfig"
                />
              </GenuiConfigProvider>
            </div>
          </section>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.assistant-layer {
  position: fixed;
  inset: 0;
  z-index: 75;
  background: rgba(17, 8, 38, 0.26);
  display: flex;
  justify-content: flex-end;
}

.assistant-drawer {
  width: min(600px, 95vw);
  height: 100%;
  background: #fcf9ff;
  border-left: 1px solid #e5d9ff;
  box-shadow: -12px 0 34px rgba(20, 8, 41, 0.24);
  display: flex;
  flex-direction: column;
}

.assistant-drawer__header {
  padding: 16px;
  border-bottom: 1px solid #eadfff;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.assistant-drawer__header h2 {
  margin: 0;
  color: #20133c;
  font-size: 18px;
}

.assistant-drawer__header p {
  margin: 4px 0 0;
  color: #73668d;
  font-size: 12px;
}

.assistant-drawer__actions {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  gap: 8px;
}

.assistant-drawer__action,
.assistant-drawer__close {
  border: 1px solid #ddcff9;
  background: #fff;
  color: #5e4e79;
  border-radius: 8px;
  height: 32px;
  padding: 0 10px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.assistant-drawer__action {
  border-color: #c4b5fd;
  color: #4c1d95;
  background: #f5f3ff;
}

.assistant-drawer__action:hover {
  background: #ede9fe;
}

.assistant-drawer__content {
  min-height: 0;
  flex: 1;
}

.assistant-chat {
  height: 100%;
}

.assistant-chat :deep(.tiny-config-provider) {
  height: 100%;
}

@media (max-width: 760px) {
  .assistant-drawer {
    width: 100vw;
  }
}
</style>
