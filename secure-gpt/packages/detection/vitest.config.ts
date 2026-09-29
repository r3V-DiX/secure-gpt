import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@securegpt/shared': resolve(__dirname, '../shared/src'),
      '@securegpt/ocr': resolve(__dirname, '../ocr/src'),
      '@securegpt/regex': resolve(__dirname, '../regex/src'),
      '@securegpt/ner': resolve(__dirname, '../ner/src'),
      '@securegpt/detection': resolve(__dirname, 'src'),
    },
  },
})
