import { ref } from 'vue'
import type { CartLine } from './useCart'

type Intent = { kind: 'cart' } | { kind: 'buyNow'; lines: CartLine[] }

const intent = ref<Intent>({ kind: 'cart' })

export function useCheckoutIntent() {
  function startBuyNow(lines: CartLine[]) {
    intent.value = { kind: 'buyNow', lines: [...lines] }
  }

  function resetIntent() {
    intent.value = { kind: 'cart' }
  }

  function linesForCheckout(cartLines: CartLine[]): CartLine[] {
    if (intent.value.kind === 'buyNow') return intent.value.lines
    return cartLines
  }

  function isBuyNow(): boolean {
    return intent.value.kind === 'buyNow'
  }

  return {
    intent,
    startBuyNow,
    resetIntent,
    linesForCheckout,
    isBuyNow,
  }
}
