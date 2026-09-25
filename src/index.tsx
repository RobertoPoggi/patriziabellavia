import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import contactRoute from './routes/contact'
import adminRoute from './routes/admin'
import blogRoute from './routes/blog'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
  ADMIN_EMAIL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Redirect apex → www (301 permanente)
// Cattura tutte le richieste a patriziabellavia.it (senza www) e reindirizza
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host === 'patriziabellavia.it') {
    const url = new URL(c.req.url)
    url.host = 'www.patriziabellavia.it'
    return c.redirect(url.toString(), 301)
  }
  await next()
})

// CORS per API
app.use('/api/*', cors({
  origin: ['https://patriziabellavia.it', 'https://www.patriziabellavia.it', 'https://patriziabellavia.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Monta le route API
app.route('/api/contact', contactRoute)
app.route('/api/admin', adminRoute)
app.route('/api/blog', blogRoute)

// Serve il pannello admin (/admin/)
app.use('/admin/*', serveStatic({ root: './' }))

// Serve tutti i file statici del sito pubblico
app.use('/*', serveStatic({ root: './' }))


// Fallback: percorsi non gestiti devono servire l'asset statico (404 corretto)
// invece di sollevare un'eccezione (500). Non tocca le route esistenti.
app.notFound((c) => {
  const assets = c.env && c.env.ASSETS
  if (assets && typeof assets.fetch === 'function') return assets.fetch(c.req.raw)
  return c.text('404 — pagina non trovata', 404)
})

app.onError((err, c) => {
  console.error('worker error:', err && err.message)
  return c.text('500 — errore interno', 500)
})

export default app
