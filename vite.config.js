import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

const GAS_EXEC_URL = 'https://script.google.com/macros/s/AKfycbzgVE9dX4qzDPNF_1leATULvRK9yHxIEVrW7u3ZRXhkmA9V9WRr_LWR3RKhUQNT_NhFZQ/exec'

function gasProxyPlugin() {
  return {
    name: 'gas-proxy',
    configureServer(server) {
      server.middlewares.use('/gas-api', async (req, res) => {
        try {
          let body = ''
          for await (const chunk of req) body += chunk
          const { action, payload } = JSON.parse(body)

          const url = new URL(GAS_EXEC_URL)
          url.searchParams.set('action', action)
          if (payload && Object.keys(payload).length > 0) {
            url.searchParams.set('payload', JSON.stringify(payload))
          }

          const gasRes = await fetch(url.toString(), { redirect: 'follow' })
          const text = await gasRes.text()

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(text)
        } catch (err) {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: err.message }))
        }
      })
    },
  }
}

const isVercel = process.env.VERCEL === '1'

export default defineConfig({
  plugins: [
    react(),
    ...(isVercel ? [] : [viteSingleFile()]),
    gasProxyPlugin(),
  ],
  build: {
    outDir: 'dist',
    ...(isVercel ? {} : { assetsInlineLimit: 100000000, cssCodeSplit: false }),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/components/**', 'src/hooks/**'],
    },
  },
})
