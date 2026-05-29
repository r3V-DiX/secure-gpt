import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@securegpt/shared': resolve(__dirname, '../shared/src'),
      '@securegpt/detection': resolve(__dirname, '../detection/src/pipeline.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
      output: {
        entryFileNames: '[name]/index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        format: 'esm',
      },
    },
    sourcemap: false,
    minify: false,
    assetsInlineLimit: 0,
  },
})
