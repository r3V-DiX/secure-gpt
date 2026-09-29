import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@securegpt/shared': resolve(__dirname, '../shared/src'),
      '@securegpt/ocr': resolve(__dirname, '../ocr/src/index.ts'),
      '@securegpt/regex': resolve(__dirname, '../regex/src/index.ts'),
      '@securegpt/ner': resolve(__dirname, '../ner/src/index.ts'),
      '@securegpt/detection': resolve(__dirname, '../detection/src/pipeline.ts'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist', // Output directly to dist so index.js is at dist/content/index.js if fileName is 'content/index.js'
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'SecureGPTContent',
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    sourcemap: true,
    minify: false,
  },
})
