export interface OrderLine {
  productId: string
  title: string
  image: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  createdAt: string
  lines: OrderLine[]
  totalAmount: number
  recipient: string
  phone: string
  address: string
}
