// ============================================================
// Auth helpers — JWT semplice con Web Crypto API
// (nessun Node.js, funziona su Cloudflare Workers)
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

export async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }))
  const unsigned = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${unsigned}.${sigB64}`
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const unsigned = `${header}.${body}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    // ricostruisce firma
    const sigPadded = sig.replace(/-/g, '+').replace(/_/g, '/')
    const sigBytes = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(unsigned))
    if (!valid) return null
    const payload = JSON.parse(atob(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function requireAuth(secret: string) {
  return async (c: any, next: any) => {
    const auth = c.req.header('Authorization') || ''
    const token = auth.replace('Bearer ', '').trim()
    if (!token) {
      // Controlla anche cookie
      const cookie = c.req.header('Cookie') || ''
      const match = cookie.match(/admin_token=([^;]+)/)
      if (!match) return c.json({ error: 'Non autorizzato' }, 401)
      const payload = await verifyJWT(match[1], secret)
      if (!payload) return c.json({ error: 'Token scaduto' }, 401)
      c.set('admin', payload)
      return next()
    }
    const payload = await verifyJWT(token, secret)
    if (!payload) return c.json({ error: 'Token non valido' }, 401)
    c.set('admin', payload)
    return next()
  }
}
