import { Hono } from 'hono'
import { hashPassword, verifyPassword, createJWT, requireAuth } from '../lib/auth'

type Bindings = { DB: D1Database; JWT_SECRET: string; ADMIN_EMAIL: string }
type Variables = { admin: Record<string, unknown> }

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── INIT (prima esecuzione — imposta password admin) ──────────────
admin.post('/init', async (c) => {
  const { password } = await c.req.json()
  if (!password || password.length < 8) {
    return c.json({ error: 'Password minimo 8 caratteri' }, 400)
  }
  // Controlla se admin esiste già con password vera
  const existing = await c.env.DB.prepare(
    'SELECT password_hash FROM admin_users WHERE username = ?'
  ).bind('admin').first<{ password_hash: string }>()

  if (existing && existing.password_hash !== 'CHANGE_ME_ON_FIRST_LOGIN') {
    return c.json({ error: 'Admin già configurato' }, 403)
  }

  const hash = await hashPassword(password)
  await c.env.DB.prepare(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = ?'
  ).bind('admin', hash, hash).run()

  return c.json({ success: true, message: 'Password admin impostata. Ora puoi accedere.' })
})

// ── LOGIN ─────────────────────────────────────────────────────────
admin.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json({ error: 'Username e password richiesti' }, 400)
  }
  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash FROM admin_users WHERE username = ?'
  ).bind(username).first<{ id: number; username: string; password_hash: string }>()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'Credenziali non valide' }, 401)
  }
  const token = await createJWT({ sub: user.id, username: user.username }, c.env.JWT_SECRET)
  return c.json({ success: true, token })
})

// ── Da qui in poi tutte le route richiedono auth ──────────────────
admin.use('/*', async (c, next) => {
  return requireAuth(c.env.JWT_SECRET)(c, next)
})

// ── DASHBOARD stats ───────────────────────────────────────────────
admin.get('/stats', async (c) => {
  const [contacts, posts, clients, newContacts] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as n FROM contacts').first<{ n: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM blog_posts').first<{ n: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM clients').first<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as n FROM contacts WHERE status = 'new'").first<{ n: number }>()
  ])
  return c.json({
    contacts: contacts?.n || 0,
    posts: posts?.n || 0,
    clients: clients?.n || 0,
    newContacts: newContacts?.n || 0
  })
})

// ── CONTATTI ──────────────────────────────────────────────────────
admin.get('/contacts', async (c) => {
  const status = c.req.query('status') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const where = status ? 'WHERE status = ?' : ''
  const params = status ? [status, limit, offset] : [limit, offset]
  const rows = await c.env.DB.prepare(
    `SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params).all()
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM contacts ${where}`
  ).bind(...(status ? [status] : [])).first<{ n: number }>()
  return c.json({ contacts: rows.results, total: total?.n || 0, page, limit })
})

admin.patch('/contacts/:id', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json()
  const valid = ['new', 'read', 'replied', 'archived']
  if (!valid.includes(status)) return c.json({ error: 'Status non valido' }, 400)
  await c.env.DB.prepare('UPDATE contacts SET status = ? WHERE id = ?').bind(status, id).run()
  return c.json({ success: true })
})

admin.delete('/contacts/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── BLOG POSTS ────────────────────────────────────────────────────
admin.get('/blog', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, slug, title, category, abstract, image_url, published, published_at, updated_at FROM blog_posts ORDER BY published_at DESC'
  ).all()
  return c.json({ posts: rows.results })
})

admin.get('/blog/:id', async (c) => {
  const id = c.req.param('id')
  const post = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first()
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404)
  return c.json(post)
})

admin.post('/blog', async (c) => {
  const data = await c.req.json()
  const { slug, title, category, abstract, content, image_url, image_position, published } = data
  if (!slug || !title || !category) {
    return c.json({ error: 'Slug, titolo e categoria obbligatori' }, 400)
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO blog_posts (slug, title, category, abstract, content, image_url, image_position, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(slug, title, category, abstract || '', content || '', image_url || '', image_position || 'top center', published ? 1 : 0).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

admin.put('/blog/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const { slug, title, category, abstract, content, image_url, image_position, published } = data
  await c.env.DB.prepare(
    `UPDATE blog_posts SET slug=?, title=?, category=?, abstract=?, content=?, image_url=?, image_position=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(slug, title, category, abstract || '', content || '', image_url || '', image_position || 'top center', published ? 1 : 0, id).run()
  return c.json({ success: true })
})

admin.delete('/blog/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── CLIENTI ───────────────────────────────────────────────────────
admin.get('/clients', async (c) => {
  const status = c.req.query('status') || ''
  const where = status ? 'WHERE status = ?' : ''
  const rows = await c.env.DB.prepare(
    `SELECT * FROM clients ${where} ORDER BY created_at DESC`
  ).bind(...(status ? [status] : [])).all()
  return c.json({ clients: rows.results })
})

admin.get('/clients/:id', async (c) => {
  const id = c.req.param('id')
  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first()
  if (!client) return c.json({ error: 'Cliente non trovato' }, 404)
  return c.json(client)
})

admin.post('/clients', async (c) => {
  const data = await c.req.json()
  const { company, sector, contact_name, contact_email, contact_phone, notes, status, start_year } = data
  if (!company) return c.json({ error: 'Nome azienda obbligatorio' }, 400)
  const result = await c.env.DB.prepare(
    `INSERT INTO clients (company, sector, contact_name, contact_email, contact_phone, notes, status, start_year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(company, sector || '', contact_name || '', contact_email || '', contact_phone || '', notes || '', status || 'active', start_year || null).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

admin.put('/clients/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const { company, sector, contact_name, contact_email, contact_phone, notes, status, start_year } = data
  await c.env.DB.prepare(
    `UPDATE clients SET company=?, sector=?, contact_name=?, contact_email=?, contact_phone=?, notes=?, status=?, start_year=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(company, sector || '', contact_name || '', contact_email || '', contact_phone || '', notes || '', status || 'active', start_year || null, id).run()
  return c.json({ success: true })
})

admin.delete('/clients/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── CHANGE PASSWORD ───────────────────────────────────────────────
admin.post('/change-password', async (c) => {
  const admin_user = c.get('admin')
  const { current_password, new_password } = await c.req.json()
  if (!new_password || new_password.length < 8) {
    return c.json({ error: 'Nuova password minimo 8 caratteri' }, 400)
  }
  const user = await c.env.DB.prepare(
    'SELECT password_hash FROM admin_users WHERE id = ?'
  ).bind(admin_user.sub).first<{ password_hash: string }>()

  if (!user || !(await verifyPassword(current_password, user.password_hash))) {
    return c.json({ error: 'Password attuale non corretta' }, 401)
  }
  const hash = await hashPassword(new_password)
  await c.env.DB.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?')
    .bind(hash, admin_user.sub).run()
  return c.json({ success: true })
})

export default admin
