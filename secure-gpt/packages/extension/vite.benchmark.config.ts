import { defineConfig } from 'vite'
import { resolve } from 'node:path'

const repo = resolve(__dirname, '../../..')

export default defineConfig({
  base: '/benchmark/',
  root: resolve(repo, 'benchmarks/detection'),
  publicDir: false,
  resolve: {
    alias: {
      'pdf-lib': resolve(repo, 'secure-gpt/node_modules/pdf-lib/es/index.js'),
      'pdfjs-dist': resolve(repo, 'secure-gpt/node_modules/pdfjs-dist/build/pdf.mjs'),
      '@': resolve(repo, 'secure-gpt/packages/extension/src'),
      '@securegpt/shared': resolve(repo, 'secure-gpt/packages/shared/src'),
      '@securegpt/ocr': resolve(repo, 'secure-gpt/packages/ocr/src/index.ts'),
      '@securegpt/regex': resolve(repo, 'secure-gpt/packages/regex/src/index.ts'),
      '@securegpt/ner': resolve(repo, 'secure-gpt/packages/ner/src/index.ts'),
      '@securegpt/detection': resolve(repo, 'secure-gpt/packages/detection/src/pipeline.ts'),
    },
  },
  build: {
    outDir: resolve(repo, 'secure-gpt/packages/extension/dist/benchmark'),
    emptyOutDir: true,
    rollupOptions: { input: {
      index: resolve(repo, 'benchmarks/detection/index.html'),
      documents: resolve(repo, 'benchmarks/detection/documents.html'),
    } },
  },
})
