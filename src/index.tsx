import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import contactRoute from './routes/contact'
import adminRoute from './routes/admin'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
  ADMIN_EMAIL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS per API
app.use('/api/*', cors({
  origin: ['https://patriziabellavia.it', 'https://www.patriziabellavia.it', 'https://patriziabellavia.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Monta le route API
app.route('/api/contact', contactRoute)
app.route('/api/admin', adminRoute)

// Redirect / → /index.html (Pages non passa / al worker se index.html esiste)
app.get('/', (c) => c.redirect('/index.html', 302))

// Serve il pannello admin (/admin/)
app.use('/admin/*', serveStatic({ root: './' }))

// Serve tutti i file statici del sito pubblico
app.use('/*', serveStatic({ root: './' }))

export default app
