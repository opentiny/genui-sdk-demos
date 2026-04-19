import OpenAI from 'openai'
import type { CustomFetch } from '@opentiny/genui-sdk-vue'
import { getOpenAITools, callMcpToolAsText } from './mcp-client'

interface OpenAIFetchConfig {
  apiKey: string
  baseURL?: string
  defaultModel?: string
  maxToolSteps?: number
}

type ParsedRequestBody = {
  model?: string
  temperature?: number
  messages?: unknown[]
}

type ToolCallDelta = {
  index?: number
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

function encodeSseChunk(encoder: TextEncoder, data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

function parseRequestBody(body: string): ParsedRequestBody {
  try {
    return JSON.parse(body) as ParsedRequestBody
  } catch {
    return {}
  }
}

function accumulateToolCalls(target: ToolCall[], deltas: ToolCallDelta[]) {
  for (const delta of deltas) {
    const index = delta.index ?? 0
    const item = (target[index] ??= {
      id: delta.id ?? '',
      type: 'function',
      function: { name: '', arguments: '' },
    })

    if (delta.id) item.id = delta.id
    if (delta.function?.name) item.function.name += delta.function.name
    if (delta.function?.arguments) item.function.arguments += delta.function.arguments
  }
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
    const result = await callMcpToolAsText(toolCall.function.name, JSON.parse(toolCall.function.arguments || '{}'))
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
你是一个电商导购助手，你的任务是根据用户的需求，推荐商品。禁止使用mock数据，必须使用mcp工具获取商品数据。推荐完商品后，最后加上加入购物按钮，并绑定方法，点击跳转到购物。
你的可展示区域宽度不大，请注意你的布局。商品卡片宽度差不多占满了显示区域，请注意排版，单行只可以放一张商品卡片。
商品卡片需要绑定加入购物车事件和打开商品详情事件，请务必给对应的事件绑定对应的交互事件, 禁止自定义方法，必须使用this.callAction中提到的方法， 例如：this.callAction('addToCart', { product: product })
如果缺少的商品，请提示用户，让用户自行通过其他方式购买。
`

export function createMcpOpenAICustomFetch(config: OpenAIFetchConfig): CustomFetch {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  })

  const maxToolSteps = config.maxToolSteps ?? 20

  return async (
    _url: string,
    options: {
      method: string
      headers: Record<string, string>
      body: string
      signal?: AbortSignal
    },
  ) => {
    const req: any = parseRequestBody(options.body)

    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let step = 0
          const currentMessages = [{ role: 'system', content: systemPrompt }, ...req.messages]

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
            let hasToolCall = false
            let shouldContinue = false

            for await (const chunk of completion) {
              const choice = chunk.choices?.[0]
              if (!choice) continue

              if (choice.delta.tool_calls && choice.delta.tool_calls.length > 0) {
                hasToolCall = true
                accumulateToolCalls(toolCalls, choice.delta.tool_calls as ToolCallDelta[])
              }

              controller.enqueue(encodeSseChunk(encoder, chunk))

              if (choice.finish_reason === 'tool_calls' && toolCalls.length > 0) {
                currentMessages.push({
                  role: 'assistant',
                  content: null,
                  tool_calls: toolCalls,
                })

                const toolResults = await Promise.all(
                  toolCalls.map(async (item, index) => ({ ...(await executeToolCall(item, currentMessages)), index })),
                )

                controller.enqueue(
                  encodeSseChunk(encoder, {
                    id: chunk.id,
                    object: 'chat.completion.chunk',
                    model: chunk.model,
                    created: chunk.created || Math.floor(Date.now() / 1000),
                    choices: [
                      {
                        index: 0,
                        delta: { tool_calls_result: toolResults },
                        finish_reason: 'tool_calls',
                      },
                    ],
                  }),
                )

                shouldContinue = true
                break
              }

              if (choice.finish_reason && choice.finish_reason !== 'tool_calls') {
                shouldContinue = false
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
