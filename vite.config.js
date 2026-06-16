import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import createOrderHandler from './api/create-order.js'
import verifyPaymentHandler from './api/verify-payment.js'
import { Buffer } from 'buffer'

// A small middleware helper to parse JSON body and mock Vercel's req/res helpers for local testing
function vercelSimulatePlugin() {
  return {
    name: 'vercel-simulate',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost');
        if (url.pathname === '/api/create-order' || url.pathname === '/api/verify-payment') {
          let body = {};
          if (req.method === 'POST') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            try {
              body = JSON.parse(data);
            } catch (err) {
              body = {};
            }
          }

          // Mock req and res properties needed by the serverless functions
          const mockReq = req;
          mockReq.body = body;

          const mockRes = res;
          mockRes.status = (code) => {
            res.statusCode = code;
            return mockRes;
          };
          mockRes.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return mockRes;
          };

          try {
            if (url.pathname === '/api/create-order') {
              await createOrderHandler(mockReq, mockRes);
            } else {
              await verifyPaymentHandler(mockReq, mockRes);
            }
          } catch (err) {
            console.error('Simulated Vercel function error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
          }
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelSimulatePlugin()],
  server: {
    proxy: {
      '/api/resend': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/resend/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'https://api.resend.com');
          });
        }
      }
    }
  }
})
