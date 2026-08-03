// post-build.mjs — eseguito dopo vite build
// 1. Sovrascrive _routes.json con esclusione di tutte le pagine statiche
// 2. Copia i file HTML senza estensione (per URL clean senza 308)
import fs from 'fs'
import path from 'path'

const dist = 'dist'

// ── 1. Copia pagine root senza estensione ───────────────────────────
const rootPages = ['chi-sono', 'servizi', 'case-history', 'contatti']
for (const page of rootPages) {
  const src = path.join(dist, `${page}.html`)
  const dst = path.join(dist, page)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst)
    console.log(`Copiato: ${page}.html → ${page}`)
  }
}

// ── 2. Copia articoli blog senza estensione ─────────────────────────
const blogDir = path.join(dist, 'blog')
const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html')
const blogSlugs = []
for (const file of blogFiles) {
  const slug = file.replace('.html', '')
  const src = path.join(blogDir, file)
  const dst = path.join(blogDir, slug)
  fs.copyFileSync(src, dst)
  blogSlugs.push(`/blog/${slug}`)
  console.log(`Copiato: blog/${file} → blog/${slug}`)
}

// ── 3. Scrivi _routes.json finale ───────────────────────────────────
const routes = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/',
    '/*.html',
    '/admin', '/admin/',
    '/blog', '/blog/',
    ...rootPages.map(p => `/${p}`),
    ...blogSlugs,
    '/images/*', '/static/*',
    '/robots.txt', '/sitemap.xml', '/blog-sitemap.xml', '/llms.txt'
  ]
}
fs.writeFileSync(path.join(dist, '_routes.json'), JSON.stringify(routes, null, 2))
console.log('_routes.json aggiornato con', routes.exclude.length, 'esclusioni')
