import { Hono } from 'hono'

// Rendering lato server degli articoli del blog.
//
// La pagina statica dell'articolo (public/blog/<slug>.html) resta il modello: titolo, H1,
// meta SEO, immagine di apertura, articoli correlati, CTA e footer non cambiano.
// Il Worker sostituisce SOLO il corpo del testo con quello salvato nel DB (campo content,
// scritto dall'editor di /admin), rigenera l'indice dai titoli H2 e aggiorna lo schema FAQ.
// Per qualsiasi anomalia (DB vuoto, errore, template mancante) serve la pagina statica
// cosi' com'e': il sito non si rompe mai.

type Bindings = { DB: D1Database; ASSETS: Fetcher }

const blogPage = new Hono<{ Bindings: Bindings }>()

const SITE = 'https://www.patriziabellavia.it'

// ── Utilita' ────────────────────────────────────────────────────────────────

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

const plain = (s: string) => decodeEntities(stripTags(s)).replace(/\s+/g, ' ').trim()

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const norm = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9\u00e0-\u00f9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const slugify = (s: string) =>
  plain(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sezione'

// ── Pulizia del contenuto salvato dall'editor ────────────────────────────────

const ALLOWED = new Set([
  'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'u', 'a', 'br', 'blockquote', 'sup', 'sub'
])
const RENAME: Record<string, string> = { h1: 'h2', b: 'strong', i: 'em', h5: 'h4', h6: 'h4' }
const DROP = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea',
  'select', 'svg', 'math', 'noscript', 'template', 'img', 'video', 'audio', 'link', 'meta'
])

function normalizeHref(href: string): string | null {
  const h = href.trim()
  if (!h) return null
  if (/^(javascript|data|vbscript):/i.test(h)) return null
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(h)) {
    return h.replace(/^https?:\/\/(www\.)?patriziabellavia\.it(?=\/|$)/i, '') || '/'
  }
  // link relativi scritti a mano: "../case-history.html", "servizi", "altro-articolo"
  let r = h.replace(/^(\.\.\/|\.\/)+/, '').replace(/\.html$/i, '')
  if (!r) return '/'
  if (!r.includes('/')) {
    return ['chi-sono', 'servizi', 'case-history', 'contatti', 'blog'].includes(r) ? '/' + r : '/blog/' + r
  }
  return '/' + r
}

async function sanitize(html: string): Promise<string> {
  const rewriter = new HTMLRewriter().on('*', {
    element(el) {
      const tag = el.tagName.toLowerCase()
      if (DROP.has(tag)) {
        el.remove()
        return
      }
      if (RENAME[tag]) el.tagName = RENAME[tag]
      const finalTag = el.tagName.toLowerCase()
      if (!ALLOWED.has(finalTag)) {
        el.removeAndKeepContent()
        return
      }
      const keepHref = finalTag === 'a' ? el.getAttribute('href') : null
      for (const [name] of [...el.attributes]) el.removeAttribute(name)
      if (finalTag === 'a') {
        const href = keepHref ? normalizeHref(keepHref) : null
        if (!href) {
          el.removeAndKeepContent()
          return
        }
        el.setAttribute('href', href)
        if (/^https?:/i.test(href)) {
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener noreferrer')
        }
      }
    },
    comments(c) {
      c.remove()
    }
  })
  return await rewriter.transform(new Response(html)).text()
}

// Rende l'HTML pronto per la pagina: niente codice visibile, niente righe vuote.
async function cleanContent(raw: string): Promise<string> {
  let c = raw.replace(/\r\n?/g, '\n').trim()

  // 1) HTML salvato "escapato" (&lt;p&gt;...): si vedrebbe il codice -> lo ripristino
  if (/&lt;\/?(p|h[1-6]|ul|ol|li|strong|em|a|br|blockquote)\b/i.test(c)) {
    c = c.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  }

  // 2) testo semplice senza tag (es. incollato da un textarea) -> paragrafi
  if (!/<[a-z][\s\S]*>/i.test(c)) {
    c = c
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>')
      .join('\n')
  }

  c = await sanitize(c)

  c = c
    .replace(/&nbsp;|\u00a0/g, ' ') // spazi "duri" aggiunti da Quill
    .replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '') // paragrafi vuoti
    .replace(/<(h[2-4])>(\s|<br\s*\/?>)*<\/\1>/gi, '') // titoli vuoti
    .replace(/<(strong|em|u)>\s*<\/\1>/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/>\s+</g, '>\n<')
    .trim()

  return c
}

// ── Indice, figure e schema FAQ ──────────────────────────────────────────────

function addIdsAndToc(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = []
  const used = new Set<string>()
  const out = html.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, inner: string) => {
    let id = slugify(inner)
    let n = 2
    const base = id
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    if (tag.toLowerCase() === 'h2') toc.push({ id, text: plain(inner) })
    return `<${tag} id="${id}">${inner}</${tag}>`
  })
  return { html: out, toc }
}

function extractFigures(region: string) {
  // figure presenti nel corpo del modello statico: l'editor non le sa rappresentare
  const figs: { html: string; afterH2Text: string; afterH2Index: number }[] = []
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>|<figure[\s\S]*?<\/figure>/gi
  let h2Count = 0
  let lastH2 = ''
  let m: RegExpExecArray | null
  while ((m = re.exec(region))) {
    if (m[0].toLowerCase().startsWith('<h2')) {
      h2Count++
      lastH2 = norm(m[1])
    } else if (!/<img[\s>]/i.test(m[0])) {
      // le foto del modello statico non si riusano: l'immagine e' sempre quella del box del blog
      figs.push({ html: m[0], afterH2Text: lastH2, afterH2Index: h2Count })
    }
  }
  return figs
}

function insertFigures(html: string, figs: ReturnType<typeof extractFigures>): string {
  if (!figs.length) return html
  const heads = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((h) => ({
    end: (h.index ?? 0) + h[0].length,
    text: norm(h[1])
  }))
  const inserts: { at: number; html: string }[] = []
  for (const f of figs) {
    if (f.afterH2Index === 0) {
      inserts.push({ at: 0, html: f.html })
      continue
    }
    const byText = heads.find((h) => h.text && h.text === f.afterH2Text)
    const target = byText ?? heads[f.afterH2Index - 1]
    if (target) inserts.push({ at: target.end, html: f.html })
  }
  inserts.sort((a, b) => b.at - a.at)
  let out = html
  for (const i of inserts) out = out.slice(0, i.at) + '\n' + i.html + '\n' + out.slice(i.at)
  return out
}

function buildFaq(html: string): { name: string; text: string }[] {
  const faqStart = html.search(/<h2[^>]*>[^<]*FAQ[^<]*<\/h2>/i)
  if (faqStart < 0) return []
  const rest = html.slice(faqStart).replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, '')
  const nextH2 = rest.search(/<h2[ >]/i)
  const block = nextH2 >= 0 ? rest.slice(0, nextH2) : rest
  const items: { name: string; text: string }[] = []
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[ >]|$)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(block))) {
    const name = plain(m[1])
    const text = plain(m[2])
    if (name && text) items.push({ name, text })
  }
  return items
}

const jsonLd = (obj: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

function updateJsonLd(page: string, faq: { name: string; text: string }[], modifiedIso: string | null) {
  return page.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (whole, body: string) => {
      let data: any
      try {
        data = JSON.parse(body)
      } catch {
        return whole
      }
      if (data && data['@type'] === 'FAQPage' && faq.length) {
        return jsonLd({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((q) => ({
            '@type': 'Question',
            name: q.name,
            acceptedAnswer: { '@type': 'Answer', text: q.text }
          }))
        })
      }
      if (data && data['@type'] === 'BlogPosting' && modifiedIso) {
        data.dateModified = modifiedIso
        return jsonLd(data)
      }
      return whole
    }
  )
}

// ── Composizione pagina ──────────────────────────────────────────────────────

type PostMeta = { title: string | null; image_url: string | null; image_position: string | null }

// Immagine di apertura: sempre quella del box di presentazione del blog (campo image_url del DB)
function buildHero(meta: PostMeta, oldCaption: string): string {
  const raw = (meta.image_url || '').trim()
  if (!/^https:\/\/[^\s"'<>()\\]+$/i.test(raw)) return ''
  const src = raw.includes('images.unsplash.com')
    ? raw.replace(/[?&]auto=format.*$/, '').replace(/\?.*$/, '') + '?auto=format&fit=crop&w=1200&q=78'
    : raw
  const alt = escapeHtml(plain(meta.title || 'Immagine di copertina dell\'articolo'))
  // Nessun ritaglio: la foto resta intera (verticale o orizzontale), centrata, con altezza massima.
  // Le foto verticali (ritratti) risultano strette e centrali, quelle orizzontali quasi a tutta larghezza.
  const safeSrc = escapeHtml(src)
  return (
    HERO_CSS +
    '<figure class="art-fig art-hero" style="margin:2rem 0 2.2rem;text-align:center;">\n' +
    `  <div class="art-hero-frame" style="--hero:url('${safeSrc}');">` +
    `<img src="${safeSrc}" alt="${alt}" loading="eager" fetchpriority="high" decoding="async"></div>\n` +
    (oldCaption ? `  <figcaption style="font-size:.82rem;color:#6b7a85;margin-top:.65rem;line-height:1.5;">${oldCaption}</figcaption>\n` : '') +
    '</figure>\n\n'
  )
}

const HERO_CSS =
  '<style id="art-hero-css">' +
  '.art-hero-frame{position:relative;overflow:hidden;border-radius:10px;background:#dfe6ea;line-height:0}' +
  '.art-hero-frame::before{content:"";position:absolute;inset:-24px;background:var(--hero) center/cover no-repeat;filter:blur(22px) saturate(1.1)}' +
  '.art-hero-frame img{position:relative;display:block;margin:0 auto;width:auto;height:auto;max-width:100%;max-height:520px}' +
  '</style>'

const TOC_RE = /<nav class="article-toc"[\s\S]*?<\/nav>/
const RELATED = '<section class="article-related">'

export async function composeArticle(template: string, content: string, updatedAt: string | null, meta: PostMeta) {
  const tocMatch = template.match(TOC_RE)
  const relatedAt = template.indexOf(RELATED)
  if (!tocMatch || tocMatch.index === undefined || relatedAt < 0) return null

  const regionStart = tocMatch.index + tocMatch[0].length
  if (relatedAt <= regionStart) return null
  const region = template.slice(regionStart, relatedAt)

  const cleaned = await cleanContent(content)
  if (!cleaned || !/<p[ >]/i.test(cleaned)) return null

  const withIds = addIdsAndToc(cleaned)
  const withFigs = insertFigures(withIds.html, extractFigures(region))

  const toc =
    '<nav class="article-toc" aria-label="Indice"><strong>Indice</strong><ol>\n' +
    withIds.toc.map((t) => `    <li><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('\n') +
    '\n  </ol></nav>\n'

  let modifiedIso: string | null = null
  if (updatedAt) {
    const d = new Date(updatedAt.replace(' ', 'T') + 'Z')
    if (!isNaN(d.getTime())) modifiedIso = d.toISOString()
  }

  // testata del modello: tolgo la vecchia foto d'archivio (se c'e') e inserisco quella del box
  let head = template.slice(0, tocMatch.index)
  let oldCaption = ''
  const h1At = head.search(/<h1[\s>]/i)
  if (h1At >= 0) {
    const tail = head.slice(h1At).replace(/<figure[\s\S]*?<\/figure>\s*/gi, (fig) => {
      const cap = fig.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      if (cap && !oldCaption) oldCaption = cap[1].trim()
      return ''
    })
    head = head.slice(0, h1At) + tail
  }
  const hero = buildHero(meta, oldCaption)

  let page = head + hero + toc + withFigs + '\n    ' + template.slice(relatedAt)

  page = updateJsonLd(page, buildFaq(withIds.html), modifiedIso)
  if (modifiedIso) {
    page = page.replace(
      /(<meta property="article:modified_time" content=")[^"]*(")/,
      `$1${modifiedIso}$2`
    )
  }
  return page
}

// ── Route ────────────────────────────────────────────────────────────────────

async function fetchTemplate(c: any, slug: string): Promise<Response | null> {
  const origin = new URL(c.req.url).origin
  // L'asset puo' rispondere con un redirect "pretty URL" (.html -> senza estensione): lo seguo
  const candidates = [`/blog/${slug}.html`, `/blog/${slug}`]
  for (const path of candidates) {
    let url = origin + path
    for (let hop = 0; hop < 3; hop++) {
      const res = await c.env.ASSETS.fetch(new Request(url, { redirect: 'manual' }))
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) break
        url = new URL(loc, url).toString()
        continue
      }
      if (res.status === 200 && (res.headers.get('content-type') || '').includes('text/html')) return res
      break
    }
  }
  return null
}

blogPage.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  // percorso legacy della pagina dinamica, non piu' usato
  if (slug === 'article' || slug === 'article.html') return c.redirect('/blog/', 301)
  if (!/^[a-z0-9-]+$/.test(slug)) return c.env.ASSETS.fetch(c.req.raw)

  const tpl = await fetchTemplate(c, slug)
  if (!tpl) return c.env.ASSETS.fetch(c.req.raw) // nessuna pagina: 404 corretto dagli asset

  const templateHtml = await tpl.clone().text()
  const passthrough = () => new Response(templateHtml, { status: 200, headers: tpl.headers })

  try {
    const post = await c.env.DB.prepare(
      'SELECT title, content, image_url, image_position, published, updated_at FROM blog_posts WHERE slug = ?'
    )
      .bind(slug)
      .first<{ title: string | null; content: string | null; image_url: string | null; image_position: string | null; published: number; updated_at: string | null }>()

    if (!post) return passthrough()

    // articolo messo in bozza dall'admin: non deve essere pubblico
    if (post.published === 0) return c.text('404 \u2014 pagina non trovata', 404)

    if (!post.content || !post.content.trim()) return passthrough()

    const composed = await composeArticle(templateHtml, post.content, post.updated_at, post)
    if (!composed) return passthrough()

    const headers = new Headers(tpl.headers)
    headers.delete('content-length')
    headers.delete('content-encoding')
    headers.delete('etag')
    headers.set('Content-Type', 'text/html; charset=utf-8')
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    headers.set('X-Article-Source', 'db')
    return new Response(composed, { status: 200, headers })
  } catch (err: any) {
    console.error('blogpage error:', slug, err && err.message)
    return passthrough()
  }
})

// Qualsiasi altro percorso sotto /blog/ -> asset statici
blogPage.all('/*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default blogPage
