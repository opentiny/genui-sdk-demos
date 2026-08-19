// vite.config.ts
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';
import packageJson from './package.json';

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, './src/index.ts'),
        materials: path.resolve(__dirname, './src/materials/index.ts'),
        meta: path.resolve(__dirname, './src/meta/index.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.dependencies || {}),
      ],
    },
  },
});