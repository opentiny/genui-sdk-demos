// vite.test.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 用于本地验证 test/ 目录下的 App.vue
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5277,
    open: true,
  },
});
