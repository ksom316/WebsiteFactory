import { existsSync } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Mounts the /api/*.ts handlers (the same files Vercel deploys as serverless
 * functions) directly into the Vite dev server, so `npm run dev` is the only command
 * needed locally — no separate API process, no `vercel dev`.
 *
 * Handlers are plain `(req, res) => void | Promise<void>` functions operating on
 * Node's standard IncomingMessage/ServerResponse, which is exactly what Vite's own
 * connect middleware passes in, and a structural subset of what Vercel's Node runtime
 * passes to serverless functions — so the same handler code runs unmodified in both.
 */
export function apiDevPlugin(): Plugin {
  const apiRoot = path.resolve(import.meta.dirname, '..', 'api')

  function resolveHandlerFile(urlPath: string): string | null {
    const relative = urlPath.replace(/^\/api\/?/, '')
    if (relative.includes('..')) return null

    const direct = path.join(apiRoot, `${relative}.ts`)
    if (existsSync(direct)) return direct

    const indexFile = path.join(apiRoot, relative, 'index.ts')
    if (existsSync(indexFile)) return indexFile

    return null
  }

  return {
    name: 'website-factory-api-dev',
    configureServer(server: ViteDevServer) {
      // Load every var from .env* files (no prefix filter) into process.env for this
      // Node process, so server-only secrets (DATABASE_URL, SESSION_SECRET, ...) are
      // available here without ever being exposed to the client bundle, which only
      // ever sees import.meta.env.VITE_* values.
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/') && url !== '/api') {
          next()
          return
        }

        const pathname = url.split('?')[0]
        const file = resolveHandlerFile(pathname)
        if (!file) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }

        try {
          const mod = await server.ssrLoadModule(file)
          const handler = mod.default as (req: IncomingMessage, res: ServerResponse) => Promise<void> | void
          await handler(req, res)
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          console.error('[api dev]', error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Internal server error.' }))
          }
        }
      })
    },
  }
}
