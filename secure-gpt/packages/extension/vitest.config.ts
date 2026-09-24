import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@securegpt/shared': resolve(__dirname, '../shared/src'),
      '@securegpt/ocr': resolve(__dirname, '../ocr/src'),
      '@securegpt/detection': resolve(__dirname, '../detection/src/pipeline.ts'),
    },
  },
})
