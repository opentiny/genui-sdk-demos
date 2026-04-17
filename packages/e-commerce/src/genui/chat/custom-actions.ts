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
            description: '待加入购物车商品',
            properties: {
              id: { type: 'string', description: '商品 id' },
              title: { type: 'string', description: '商品标题' },
              price: { type: 'number', description: '商品价格' },
              image: { type: 'string', description: '商品图片 URL' },
              description: { type: 'string', description: '商品描述' },
              tags: { type: 'array', description: '标签数组' },
              rating: { type: 'number', description: '评分' },
              ratingCount: { type: 'number', description: '评分人数' },
              inStock: { type: 'boolean', description: '是否有货' },
              badgeText: { type: 'string', description: '角标文案' },
            },
            required: ['id', 'title', 'price'],
          },
        },
        required: ['product'],
      } as const,
      execute: (params: unknown) => {
        const parsed = z
          .object({ product: ProductActionSchema })
          .safeParse(params)
        if (!parsed.success) return
        options.addProduct(parsed.data.product as Product)
      },
    },
    {
      name: 'openProduct',
      description: '跳转到商品详情页',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: '商品 id' },
        },
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
      parameters: {
        type: 'object',
        properties: {},
      } as const,
      execute: () => {
        options.openCart()
      },
    },
  ] as ICustomActionItem[]
}
