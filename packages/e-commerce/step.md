# 现有电商系统增量改造：生成式 UI 集成实施手册（可直接照做）

适用场景：你已经有电商系统（商品、详情、购物车、路由、后端接口），现在要在**不重构主业务**的前提下，增加 AI 导购能力。  
目标结果：页面新增 AI 抽屉，模型可调用商品搜索工具，并在回答里渲染商品卡，支持“加购/跳详情/打开购物车”。

---

## 0. 改造原则（先看）

1. 只做增量改造，不重写现有业务模块。
2. 商品数据来源复用你现有接口（例如 `searchProducts`），不新增 mock 方案。
3. GenUI 只负责“对话与渲染”，业务动作仍由你当前 store/router 执行。
4. MCP 只做协议包装层：把现有接口包装成工具给模型调用。

---

## 1. 增量依赖安装（重点）

> 只安装你项目里尚未存在的依赖，不做全量 install 替换。

先在 `sites/e-commerce/package.json` 对比是否已有以下包：

- `@opentiny/genui-sdk-vue`
- `@modelcontextprotocol/sdk`
- `openai`
- `zod`
- `@opentiny/vue`
- `@opentiny/vue-directive`
- `@opentiny/vue-icon`

只安装缺失项（示例命令）：

```bash
pnpm --filter e-commerce add @opentiny/genui-sdk-vue @modelcontextprotocol/sdk openai zod @opentiny/vue @opentiny/vue-directive @opentiny/vue-icon
```

如果你只缺其中几个，请只保留那几个包执行安装。

---

## 2. 新增 MCP 工具层（复用现有商品搜索 API）

新增文件：`src/genui/mcp/product-mcp.ts`

作用：把你已有“商品搜索接口”包装成 MCP Tool，供模型调用。

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { searchProducts } from '../../api'
import type { Product } from '../../types'

export const SEARCH_PRODUCTS_TOOL = 'search_products'

export const SearchProductsArgsSchema = z.object({
  keyword: z.string().min(1, 'keyword 不能为空'),
  limit: z.number().int().min(1).max(10).optional(),
})

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  image: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  rating: z.number(),
  ratingCount: z.number(),
  inStock: z.boolean(),
  badgeText: z.string(),
})

export const SearchProductsResultSchema = z.object({
  tool: z.literal(SEARCH_PRODUCTS_TOOL),
  keyword: z.string(),
  total: z.number().int().min(0),
  found: z.boolean(),
  results: z.array(ProductSchema),
})

type SearchProductsArgs = z.infer<typeof SearchProductsArgsSchema>

async function searchProductsByBusiness(keyword: string, limit = 4): Promise<Product[]> {
  const results = await searchProducts(keyword)
  return results.slice(0, limit)
}

export function createProductMcpServer() {
  const server = new McpServer(
    { name: 'e-commerce-product-mcp-server', version: '1.0.0' },
    {},
  )

  server.registerTool(
    SEARCH_PRODUCTS_TOOL,
    {
      title: '搜索商品',
      description: '根据关键词在商品库中搜索商品',
      inputSchema: SearchProductsArgsSchema,
    },
    async (rawArgs) => {
      const parsedArgs = SearchProductsArgsSchema.safeParse(rawArgs)
      if (!parsedArgs.success) throw new Error('参数校验失败')

      const { keyword, limit = 4 }: SearchProductsArgs = parsedArgs.data
      const results = await searchProductsByBusiness(keyword, limit)

      const payload = SearchProductsResultSchema.parse({
        tool: SEARCH_PRODUCTS_TOOL,
        keyword,
        total: results.length,
        found: results.length > 0,
        results,
      })

      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      }
    },
  )

  return server
}
```

你要改的唯一业务点：`searchProducts` 对接你们现有服务层即可。

---

## 3. 新增 MCP Client 桥接层（给 OpenAI function tools 用）

新增文件：`src/genui/mcp/mcp-client.ts`

```ts
import OpenAI from 'openai'
import { Client } from '@modelcontextprotocol/sdk/client'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import {
  SearchProductsArgsSchema,
  SearchProductsResultSchema,
  SEARCH_PRODUCTS_TOOL,
  createProductMcpServer,
} from './product-mcp'

let clientPromise: Promise<Client> | null = null

async function createClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createProductMcpServer()
  await server.connect(serverTransport)

  const client = new Client({ name: 'e-commerce-product-mcp-client', version: '1.0.0' }, {})
  await client.connect(clientTransport)
  return client
}

export function getMcpClient() {
  if (!clientPromise) clientPromise = createClient()
  return clientPromise
}

export async function getOpenAITools() {
  const client = await getMcpClient()
  const raw = await (client as unknown as {
    listTools: () => Promise<{ tools?: Array<Record<string, unknown>> }>
  }).listTools()
  const tools = Array.isArray(raw?.tools) ? raw.tools : []

  return tools
    .filter((tool) => typeof tool?.name === 'string')
    .map(
      (tool) =>
        ({
          type: 'function',
          function: {
            name: tool.name as string,
            description: typeof tool.description === 'string' ? tool.description : '',
            parameters:
              tool.inputSchema && typeof tool.inputSchema === 'object'
                ? (tool.inputSchema as Record<string, unknown>)
                : { type: 'object', properties: {} },
          },
        }) as OpenAI.Chat.Completions.ChatCompletionTool,
    )
}

export async function callMcpToolAsText(name: string, args: Record<string, unknown> = {}) {
  const client = await getMcpClient()
  const result = await client.callTool({ name, arguments: args })
  const content = Array.isArray((result as { content?: unknown }).content)
    ? ((result as { content: Array<{ type?: string; text?: string }> }).content ?? [])
    : []
  const text = content.find((item) => item.type === 'text' && typeof item.text === 'string')?.text
  return text ?? JSON.stringify(result)
}

export async function callSearchProductsViaMcp(keyword: string, limit = 4) {
  const args = SearchProductsArgsSchema.parse({ keyword, limit })
  const text = await callMcpToolAsText(SEARCH_PRODUCTS_TOOL, args)
  const parsed = SearchProductsResultSchema.safeParse(JSON.parse(text))
  if (!parsed.success) throw new Error('MCP payload 校验失败')
  return parsed.data
}
```

---

## 4. 改造 `customFetch`（支持流式工具调用循环）

新增/改造文件：`src/genui/mcp/custom-fetch.ts`

作用：接管 `GenuiChat` 请求，驱动“模型 -> 工具 -> 模型”的循环。

```ts
import OpenAI from 'openai'
import type { CustomFetch } from '@opentiny/genui-sdk-vue'
import { getOpenAITools, callMcpToolAsText } from './mcp-client'

interface OpenAIFetchConfig {
  apiKey: string
  baseURL?: string
  defaultModel?: string
  maxToolSteps?: number
}

type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

function encodeSseChunk(encoder: TextEncoder, data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

async function executeToolCall(toolCall: ToolCall, currentMessages: unknown[]) {
  const createResult = (result: string) => {
    currentMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: result })
    return {
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
        result,
      },
    }
  }

  try {
    const result = await callMcpToolAsText(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments || '{}'),
    )
    return createResult(JSON.stringify(result))
  } catch (error) {
    return createResult(
      JSON.stringify({
        error: error instanceof Error ? error.message : '工具执行失败',
      }),
    )
  }
}

const systemPrompt = `
你是一个电商导购助手，你的任务是根据用户需求推荐商品，必须优先通过 mcp 工具获取商品数据。
推荐时请使用 ProductCard 渲染，并确保 onAdd/onOpen 两个事件正确绑定。
`

export function createMcpOpenAICustomFetch(config: OpenAIFetchConfig): CustomFetch {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  })

  const maxToolSteps = config.maxToolSteps ?? 8

  return async (_url, options) => {
    const req = JSON.parse(options.body || '{}')
    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let step = 0
          const currentMessages = [{ role: 'system', content: systemPrompt }, ...(req.messages ?? [])]
          const tools = await getOpenAITools()

          while (step < maxToolSteps) {
            const completion = await openai.chat.completions.create(
              {
                ...req,
                messages: currentMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
                tools,
                tool_choice: 'auto',
                stream: true,
              },
              { signal: options.signal },
            )

            const toolCalls: ToolCall[] = []
            let shouldContinue = false
            let hasToolCall = false

            for await (const chunk of completion) {
              const choice = chunk.choices?.[0]
              if (!choice) continue

              if (choice.delta.tool_calls?.length) {
                hasToolCall = true
                for (const delta of choice.delta.tool_calls as Array<any>) {
                  const index = delta.index ?? 0
                  const item = (toolCalls[index] ??= {
                    id: delta.id ?? '',
                    type: 'function',
                    function: { name: '', arguments: '' },
                  })
                  if (delta.id) item.id = delta.id
                  if (delta.function?.name) item.function.name += delta.function.name
                  if (delta.function?.arguments) item.function.arguments += delta.function.arguments
                }
              }

              controller.enqueue(encodeSseChunk(encoder, chunk))

              if (choice.finish_reason === 'tool_calls' && toolCalls.length > 0) {
                currentMessages.push({ role: 'assistant', content: null, tool_calls: toolCalls })
                const toolResults = await Promise.all(
                  toolCalls.map(async (item, index) => ({ ...(await executeToolCall(item, currentMessages)), index })),
                )

                controller.enqueue(
                  encodeSseChunk(encoder, {
                    id: chunk.id,
                    object: 'chat.completion.chunk',
                    model: chunk.model,
                    created: chunk.created || Math.floor(Date.now() / 1000),
                    choices: [{ index: 0, delta: { tool_calls_result: toolResults }, finish_reason: 'tool_calls' }],
                  }),
                )
                shouldContinue = true
                break
              }
            }

            step += 1
            if (!hasToolCall || !shouldContinue) break
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.enqueue(
            encodeSseChunk(encoder, {
              error: {
                message: error instanceof Error ? error.message : 'customFetch 处理失败',
                type: 'custom_fetch_error',
              },
            }),
          )
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }
}
```

---

## 5. 新增自定义组件注册（复用现有 `ProductCard`）

新增文件：`src/genui/chat/custom-components.ts`

```ts
import ProductCard from '../../components/ProductCard.vue'

export const customComponents = [
  {
    component: 'ProductCard',
    name: '导购商品卡片',
    description:
      '展示推荐商品信息，单张卡片宽度是600px，请注意排版，另外组件包含onOpen和onAdd事件，请务必给对应的事件绑定对应的交互事件',
    schema: {
      properties: [
        { property: 'id', type: 'string', description: '商品 id' },
        { property: 'title', type: 'string', description: '商品标题', required: true },
        { property: 'price', type: 'number', description: '商品价格', required: true },
        { property: 'image', type: 'string', description: '商品图片 URL' },
        { property: 'description', type: 'string', description: '商品描述' },
        { property: 'tags', type: 'array', description: '标签数组' },
        { property: 'rating', type: 'number', description: '评分，0-5' },
        { property: 'ratingCount', type: 'number', description: '评分人数' },
        { property: 'inStock', type: 'boolean', description: '是否有货' },
        { property: 'badgeText', type: 'string', description: '角标文案' },
        { property: 'onOpen', type: 'function', description: '打开商品详情，必须绑定跳转商品页详情事件' },
        { property: 'onAdd', type: 'function', description: '加入购物车，必须绑定加入购物车事件' },
      ],
    },
    ref: ProductCard,
  },
]
```

---

## 6. 新增自定义动作（对接现有购物车与路由）

新增文件：`src/genui/chat/custom-actions.ts`

```ts
import { z } from 'zod'
import type { ICustomActionItem } from '@opentiny/genui-sdk-vue'
import type { Product } from '../../types'

const ProductActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  image: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().optional(),
  ratingCount: z.number().optional(),
  inStock: z.boolean().optional(),
  badgeText: z.string().optional(),
})

const OpenProductSchema = z.object({
  productId: z.string(),
})

type CreateActionOptions = {
  addProduct: (product: Product) => void
  openProduct: (id: string) => void
  openCart: () => void
}

export function createCustomActions(options: CreateActionOptions) {
  return [
    {
      name: 'addToCart',
      description: '将商品加入购物车',
      parameters: {
        type: 'object',
        properties: {
          product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'number' },
              image: { type: 'string' },
              description: { type: 'string' },
              tags: { type: 'array' },
              rating: { type: 'number' },
              ratingCount: { type: 'number' },
              inStock: { type: 'boolean' },
              badgeText: { type: 'string' },
            },
            required: ['id', 'title', 'price'],
          },
        },
        required: ['product'],
      } as const,
      execute: (params: unknown) => {
        const parsed = z.object({ product: ProductActionSchema }).safeParse(params)
        if (!parsed.success) return
        options.addProduct(parsed.data.product as Product)
      },
    },
    {
      name: 'openProduct',
      description: '跳转到商品详情页',
      parameters: {
        type: 'object',
        properties: { productId: { type: 'string' } },
        required: ['productId'],
      } as const,
      execute: (params: unknown) => {
        const parsed = OpenProductSchema.safeParse(params)
        if (!parsed.success) return
        options.openProduct(parsed.data.productId)
      },
    },
    {
      name: 'openCart',
      description: '打开当前用户购物车页面',
      parameters: { type: 'object', properties: {} } as const,
      execute: () => options.openCart(),
    },
  ] as ICustomActionItem[]
}
```

---

## 7. 新增 AI 抽屉组件并挂载 GenUI

新增文件：`src/components/AIAssistantDrawer.vue`

核心脚本（保留你现有 store/router，不要替换）：

```vue
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

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

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
  maxToolSteps: 8,
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
```

模板中挂载 `GenuiChat`：

```vue
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
```

---

## 8. 改造 `App.vue` 挂全局入口（最小侵入）

修改文件：`src/App.vue`

脚本部分：

```ts
import { defineAsyncComponent, ref } from 'vue'

const assistantOpen = ref(false)
const AIAssistantDrawer = defineAsyncComponent(
  () => import('./components/AIAssistantDrawer.vue'),
)
```

模板部分：

```vue
<button
  class="assistant-fab"
  type="button"
  aria-label="打开 AI 导购助手"
  @click="assistantOpen = true"
>
  <span class="assistant-fab__dot">AI</span>
  <span class="assistant-fab__text">导购助手</span>
</button>

<AIAssistantDrawer
  v-if="assistantOpen"
  v-model="assistantOpen"
/>
```

这样改完，AI 助手对现有页面零侵入。

---

## 9. 环境变量（增量添加）

在现有环境文件基础上补充：

```env
VITE_OPENAI_API_KEY=你的key
VITE_OPENAI_BASE_URL=http://localhost:3100
VITE_CHAT_COMPLETIONS_URL=http://localhost:3100/chat/completions
VITE_GENUI_MODEL=deepseek-v3.2
```

说明：

1. `VITE_CHAT_COMPLETIONS_URL` 给 `GenuiChat.url` 使用。
2. `VITE_OPENAI_BASE_URL` + `VITE_OPENAI_API_KEY` 给 `customFetch` 内部 OpenAI 客户端使用。
3. 如有公司网关，这两个地址都指向网关。

---

## 10. 执行顺序（照做版）

1. 安装缺失依赖（只装增量）。
2. 新增 `src/genui/mcp/product-mcp.ts`。
3. 新增 `src/genui/mcp/mcp-client.ts`。
4. 新增/改造 `src/genui/mcp/custom-fetch.ts`。
5. 新增 `src/genui/chat/custom-components.ts`。
6. 新增 `src/genui/chat/custom-actions.ts`。
7. 新增 `src/components/AIAssistantDrawer.vue` 并挂载 `GenuiChat`。
8. 修改 `src/App.vue` 增加悬浮入口和抽屉懒加载。
9. 补环境变量并启动验证。

---

## 11. 验收清单（必须全部通过）

1. 任意页面可见“AI 导购助手”悬浮按钮。
2. 输入“推荐通勤包”，能触发 `search_products` 工具调用。
3. 返回内容出现 `ProductCard`（非纯文本推荐）。
4. 点“加入购物车”可真正加购并出现业务提示。
5. 点“查看详情”可跳商品详情页。
6. 让 AI “打开购物车”可跳转 `/cart`。
7. 工具异常时前端有错误反馈，不会卡死会话。

---

## 12. 本次改造文件清单

```text
src/
  App.vue
  components/
    AIAssistantDrawer.vue
  genui/
    chat/
      custom-actions.ts
      custom-components.ts
    mcp/
      custom-fetch.ts
      mcp-client.ts
      product-mcp.ts
```
