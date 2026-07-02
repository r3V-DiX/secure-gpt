// build.mjs — copies public assets after vite build
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, 'dist')
const pub = resolve(__dirname, 'public')

// 1. Run vite builds
console.log('Building main extension...')
execSync('vite build', { stdio: 'inherit' })
console.log('Building content script...')
execSync('vite build --config vite.content.config.ts', { stdio: 'inherit' })

// 2. Copy public assets to dist
console.log('Copying public assets...')
cpSync(pub, dist, { recursive: true })

// 3. Copy onnxruntime-web WASM files to dist/wasm
console.log('Copying WASM binaries...')
const wasmDir = resolve(dist, 'wasm')
const ortWasmDir = resolve(__dirname, '../../node_modules/onnxruntime-web/dist')
mkdirSync(wasmDir, { recursive: true })

// Copy required WASM files: base (WASM fallback) + jsep (WebGPU provider)
const files = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
]
for (const file of files) {
  const src = resolve(ortWasmDir, file)
  const dest = resolve(wasmDir, file)
  try {
    copyFileSync(src, dest)
    console.log(`Copied ${file} to dist/wasm/`)
  } catch (err) {
    console.warn(`Warning: Could not copy ${file}: ${err.message}`)
  }
}

// 4. Inject Google Client ID from env
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf-8'))

// 3.5 Copy pdfjs worker to dist/assets
console.log('Copying PDF.js worker...')
const assetsDir = resolve(dist, 'assets')
mkdirSync(assetsDir, { recursive: true })
const pdfjsWorkerSrc = resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
const pdfjsWorkerDest = resolve(assetsDir, 'pdf.worker.min.mjs')
try {
  copyFileSync(pdfjsWorkerSrc, pdfjsWorkerDest)
  console.log(`Copied pdf.worker.min.mjs to dist/assets/`)
} catch (err) {
  console.warn(`Warning: Could not copy pdf.worker.min.mjs: ${err.message}`)
}
if (process.env.GOOGLE_CLIENT_ID) {
  if (!manifest.oauth2) manifest.oauth2 = {}
  manifest.oauth2.client_id = process.env.GOOGLE_CLIENT_ID
}
writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log('Extension built successfully → dist/')
console.log('Load dist/ as unpacked extension in chrome://extensions')
