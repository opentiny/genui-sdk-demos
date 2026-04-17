import OpenAI from 'openai'
import { Client } from '@modelcontextprotocol/sdk/client'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createProductMcpServer } from './product-mcp'

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
  const raw = await (client as unknown as { listTools: () => Promise<{ tools?: Array<Record<string, unknown>> }> }).listTools()
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
