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
