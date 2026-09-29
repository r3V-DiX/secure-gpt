import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: { setupFiles: ['../detection/tests/setup.ts'], environment: 'node' },
  resolve: { alias: { '@securegpt/shared': resolve(__dirname, '../shared/src') } },
})
