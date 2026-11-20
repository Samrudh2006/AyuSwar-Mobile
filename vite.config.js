import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import gnaniStatusHandler from './api/gnani/status.js'
import gnaniTtsHandler from './api/gnani/tts.js'
import gnaniSttHandler from './api/gnani/stt.js'
import evonStatusHandler from './api/evon/status.js'
import evonChatHandler from './api/evon/chat.js'
import groqStatusHandler from './api/groq/status.js'
import groqChatHandler from './api/groq/chat.js'
import groqTranscribeHandler from './api/groq/transcribe.js'
import triageHandler from './api/triage.js'

// Dev-server adapter: run the REAL Vercel-style handlers from api/ inside the
// vite dev server. Local development exercises the exact same code path as
// production, including fail-closed caller auth and config-only status routes
// (no divergent dev-only proxy logic that could bypass the gates).
function vercelDevAdapter(handler) {
  return (req, res) => {
    (async () => {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const raw = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', (chunk) => { data += chunk; });
          req.on('end', () => resolve(data));
          req.on('error', reject);
        });
        try {
          req.body = JSON.parse(raw || '{}');
        } catch {
          req.body = raw; // handlers also accept raw base64 string bodies
        }
      }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (payload) => {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
        return res;
      };
      try {
        await handler(req, res);
      } catch {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Dev adapter handler error' }));
        }
      }
    })();
  };
}

let outDir = null;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        // onnxruntime-web resolves its WASM runtime from ort.env.wasm.wasmPaths,
        // which the local TTS worker pins to <base>/ort-wasm/ so inference can
        // NEVER fall back to a CDN. Copy the grounded variant set from
        // node_modules at build time:
        //   jsep pair        = primary (WebAssembly-exception engine, ort 1.31 default)
        //   plain pair       = fallback when jsep init fails (older WebViews)
        // asyncify (28.7MB) and jspi (17.9MB, flag-gated) variants are
        // deliberately NOT shipped; verified against the actual requests the
        // runtime makes in the built-app check.
        name: 'copy-ort-wasm',
        apply: 'build',
        configResolved(config) { outDir = join(config.root, config.build.outDir); },
        closeBundle() {
          const src = join(process.cwd(), 'node_modules', 'onnxruntime-web', 'dist');
          const dest = join(outDir, 'ort-wasm');
          mkdirSync(dest, { recursive: true });
          for (const f of [
            'ort-wasm-simd-threaded.jsep.mjs',
            'ort-wasm-simd-threaded.jsep.wasm',
            'ort-wasm-simd-threaded.mjs',
            'ort-wasm-simd-threaded.wasm'
          ]) {
            copyFileSync(join(src, f), join(dest, f));
          }
        }
      },
      {
        name: 'ayuswar-api-dev-middleware',
        configureServer(server) {
          // Make .env values visible to the real handlers (they read process.env),
          // matching the previous dev middleware's env-first precedence.
          for (const [key, value] of Object.entries(env)) {
            process.env[key] = value;
          }
          server.middlewares.use('/api/gnani/status', vercelDevAdapter(gnaniStatusHandler));
          server.middlewares.use('/api/gnani/tts', vercelDevAdapter(gnaniTtsHandler));
          server.middlewares.use('/api/gnani/stt', vercelDevAdapter(gnaniSttHandler));
          server.middlewares.use('/api/gnani/asr', vercelDevAdapter(gnaniSttHandler)); // asr is an alias of stt
          server.middlewares.use('/api/evon/status', vercelDevAdapter(evonStatusHandler));
          server.middlewares.use('/api/evon/chat', vercelDevAdapter(evonChatHandler));
          server.middlewares.use('/api/groq/status', vercelDevAdapter(groqStatusHandler));
          server.middlewares.use('/api/groq/chat', vercelDevAdapter(groqChatHandler));
          server.middlewares.use('/api/groq/transcribe', vercelDevAdapter(groqTranscribeHandler));
          server.middlewares.use('/api/triage', vercelDevAdapter(triageHandler));
        }
      }
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router') || id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/@tensorflow')) {
              return 'vendor-tfjs';
            }
            if (id.includes('node_modules/maplibre-gl')) {
              return 'vendor-maplibre';
            }
            if (id.includes('node_modules/tesseract.js')) {
              return 'vendor-tesseract';
            }
            if (id.includes('node_modules/canvas-confetti') || id.includes('node_modules/roughjs')) {
              return 'vendor-visuals';
            }
          }
        }
      }
    }
  };
});
