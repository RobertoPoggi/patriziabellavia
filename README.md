# Patrizia Bellavia — HR Senior Advisor & Partner

## Panoramica
Sito web professionale per Patrizia Bellavia, HR Senior Advisor & Partner a Milano.

- **Dominio**: https://www.patriziabellavia.it
- **Cloudflare Pages**: https://patriziabellavia.pages.dev
- **Ultimo deploy**: https://98ccbc07.patriziabellavia.pages.dev
- **Account Cloudflare**: aba4cdbf5123bd16bfd76220afab9ed0

## Funzionalità completate

### Contenuto
- Home page con hero video, bio, servizi, recensioni
- Pagina Chi Sono (ProfilePage schema)
- Pagina Servizi HR (7 servizi, FAQPage, ItemList schema)
- Pagina Case History (4 case study con immagini reali)
- Pagina Contatti (ContactPage, ContactPoint schema, form con anti-bot quiz)
- Blog con 15 articoli HR (aggiunti: diversità generazionale, offboarding/alumni network, upskilling/reskilling AI; migrazione `migrations/0002_add_blog_posts_13_15.sql`)
- Pannello Admin `/admin`
- Privacy Policy / Cookie Policy

### SEO / GEO / GEO-AI
- Schema.org completo: `@graph` su home, ProfilePage, CollectionPage, ContactPage, WebPage, FAQPage, ItemList, Service, AggregateRating, Review, BreadcrumbList, Speakable, ContactPoint, mentions
- Canonical URL senza `.html` su tutte le pagine
- `hreflang` it-IT / x-default
- Open Graph + Twitter Card su tutte le pagine
- `meta name="keywords"` su tutte le pagine
- `geo.*` meta tags + GeoCoordinates
- `sitemap.xml` con image:image (4 case-history)
- `sitemap-index.xml`
- `blog-sitemap.xml` con news:news (URL canonici senza .html)
- `robots.txt` ottimizzato con 20+ AI bot allowlist
- `llms.txt` (~10.5KB) ottimizzato per LLM/AI
- `ai.txt` per Anthropic/Claude/Gemini
- `_headers` con Cache-Control, security headers, Content-Type

### Tecnico
- Hono framework + Cloudflare Pages Workers
- D1 SQLite database (`patriziabellavia-db`)
- API REST `/api/contact`, `/api/blog`, `/api/admin`
- `post-build.mjs` → URL clean senza estensione, _routes.json (34 esclusioni)
- Immagini case-history reali (case1–4 banner)

## Pubblicazione articoli del blog (SSR dal DB)

- La pagina `/blog/<slug>` e' una **pagina statica usata come template**: il Worker (`src/routes/blogpage.ts`) legge il campo `content` da D1 (`blog_posts`) e lo inserisce nell'HTML gia' pronto nella risposta (SEO intatta, nessun JS lato client).
- Titolo, H1, meta, canonical e Open Graph restano quelli SEO della pagina statica; il testo viene dal DB (modificabile da `/admin/`).
- Il Worker rigenera l'indice (TOC) dagli H2, mantiene le immagini/figure del template, aggiorna il JSON-LD FAQPage e `dateModified`.
- L'HTML dell'admin viene sanificato (whitelist tag, `&lt;p&gt;` ripristinato, `&nbsp;` e paragrafi vuoti rimossi, link `javascript:` eliminati, link esterni con `rel=noopener`).
- Fallback: se il `content` e' vuoto o la composizione fallisce, viene servita la pagina statica. Articolo con `published=0` -> 404.
- `_routes.json` (generato da `scripts/post-build.mjs`) invia al Worker `/api/*` e gli articoli `/blog/<slug>`; indice blog, immagini e sitemap restano statici.
- Header di debug: `X-Article-Source: db`.
- Migrazioni: `0002` (articoli 13-15), `0003` (contenuto articoli 13-15), `0004` (titoli SEO + riallineo `assessment-soft-skill` e `talent-review` alla pagina live).
- Nuovo articolo creato dall'admin: serve anche un file template `public/blog/<slug>.html` (copia di un articolo esistente) + regola in `_redirects`.

## Stack tecnologico
- Hono 4.x + TypeScript
- Cloudflare Pages (D1, Workers)
- Vite + @hono/vite-cloudflare-pages
- Wrangler 4.x

## Comandi principali
```bash
npm run build          # Build Vite + post-build.mjs
npm run deploy         # Build + deploy Cloudflare Pages

# Database locale
npm run db:migrate:local
npm run db:seed

# Deploy con account ID esplicito
CLOUDFLARE_ACCOUNT_ID=aba4cdbf5123bd16bfd76220afab9ed0 npx wrangler pages deploy dist --project-name patriziabellavia
```

## File SEO chiave
| File | Scopo |
|---|---|
| `public/sitemap.xml` | Sitemap principale con image:image |
| `public/sitemap-index.xml` | Sitemap index |
| `public/blog-sitemap.xml` | Sitemap blog con news:news |
| `public/robots.txt` | Regole crawler + AI bot allowlist |
| `public/llms.txt` | Knowledge file per LLM/AI |
| `public/ai.txt` | Knowledge file per Anthropic/Claude/Gemini |
| `public/_headers` | Cache-Control + security + Content-Type |

## Ultimo deploy
- **Data**: 2026-08-03
- **Commit**: `1767f9a` — SEO/GEO/GEO-AI completo
- **URL preview**: https://98ccbc07.patriziabellavia.pages.dev
- **Status**: ✅ Attivo
