<template>
  <section class="panel not-found">
    <p class="not-found__code">404</p>
    <h1 class="section-title">页面不存在</h1>
    <p class="section-desc">你访问的地址可能已变更，或者输入有误。</p>
    <RouterLink to="/" class="not-found__back">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  padding: 28px;
  text-align: center;
}

.not-found__code {
  margin: 0;
  color: var(--accent);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
}

.not-found__back {
  display: inline-block;
  margin-top: 16px;
  padding: 9px 14px;
  border-radius: 10px;
  text-decoration: none;
  color: #fff;
  background: linear-gradient(135deg, #0f9f93 0%, #0ea5e9 100%);
}
</style>
