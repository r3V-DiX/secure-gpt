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

// Copy all .wasm and .mjs files from onnxruntime-web/dist
const files = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jspi.wasm',
  'ort-wasm-simd-threaded.jspi.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.asyncify.mjs'
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
if (process.env.GOOGLE_CLIENT_ID) {
  if (!manifest.oauth2) manifest.oauth2 = {}
  manifest.oauth2.client_id = process.env.GOOGLE_CLIENT_ID
}
writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log('Extension built successfully → dist/')
console.log('Load dist/ as unpacked extension in chrome://extensions')
