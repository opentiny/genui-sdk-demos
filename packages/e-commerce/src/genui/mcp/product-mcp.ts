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

export type SearchProductsArgs = z.infer<typeof SearchProductsArgsSchema>
export type SearchProductsResult = z.infer<typeof SearchProductsResultSchema>

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
      if (!parsedArgs.success) {
        throw new Error('参数校验失败')
      }

      const { keyword, limit = 4 } = parsedArgs.data
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
