import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    // S3 proxy for Zama public key fetches (avoid CORS blocking)
    {
      name: 's3-cors-proxy',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/__s3proxy')) {
              try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const target = url.searchParams.get('url');
                if (!target) {
                  res.statusCode = 400;
                  res.end('missing url');
                  return;
                }
                fetch(target)
                  .then(r => {
                    res.statusCode = r.status;
                    r.headers.forEach((v, k) => res.setHeader(k, v));
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    return r.arrayBuffer();
                  })
                  .then(b => res.end(Buffer.from(b)))
                  .catch(e => {
                    res.statusCode = 502;
                    res.end(`error: ${e.message}`);
                  });
              } catch (e) {
                res.statusCode = 500;
                res.end(`error: ${e.message}`);
              }
              return;
            }
            next();
          });
        };
      }
    },
    react(),
    nodePolyfills({
      include: ['buffer', 'process']
    })
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    middlewareMode: false
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['fhevmjs', 'ethers', '@zama-fhe/relayer-sdk/web'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      external: []
    }
  },
  define: {
    global: 'globalThis',
  }
})