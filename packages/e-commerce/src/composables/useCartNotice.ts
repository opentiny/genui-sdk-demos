import { ref } from 'vue'

const visible = ref(false)
const productTitle = ref('')

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function useCartNotice() {
  function showCartNotice(title: string) {
    productTitle.value = title
    visible.value = true
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      visible.value = false
    }, 2600)
  }

  function closeCartNotice() {
    visible.value = false
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  return {
    cartNoticeVisible: visible,
    cartNoticeTitle: productTitle,
    showCartNotice,
    closeCartNotice,
  }
}
