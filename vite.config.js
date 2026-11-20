import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
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
