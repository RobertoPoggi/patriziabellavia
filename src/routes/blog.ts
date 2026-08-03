import { Hono } from 'hono'

type Bindings = { DB: D1Database }

const blog = new Hono<{ Bindings: Bindings }>()

// Lista articoli pubblicati (per index blog)
blog.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT id, slug, title, category, abstract, image_url, image_position, published_at, updated_at
     FROM blog_posts WHERE published = 1 ORDER BY published_at DESC`
  ).all()
  return c.json({ posts: rows.results })
})

// Singolo articolo per slug
blog.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const post = await c.env.DB.prepare(
    `SELECT * FROM blog_posts WHERE slug = ? AND published = 1`
  ).bind(slug).first()
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404)
  return c.json(post)
})

export default blog
