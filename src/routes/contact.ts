import { Hono } from 'hono'
import { sendEmail, contactEmailHtml } from '../lib/email'

type Bindings = { DB: D1Database; RESEND_API_KEY: string; ADMIN_EMAIL: string }

const contact = new Hono<{ Bindings: Bindings }>()

contact.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, message, antispam } = body

    // Validazione base
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return c.json({ success: false, error: 'Campi obbligatori mancanti' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'Email non valida' }, 400)
    }
    // Anti-spam honeypot
    if (antispam) {
      return c.json({ success: true }) // silenzioso
    }
    // Anti-spam domanda (5 è la risposta giusta)
    if (body.answer !== '5' && body.answer !== 5) {
      return c.json({ success: false, error: 'Risposta anti-robot errata' }, 400)
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || ''

    // Salva in D1
    await c.env.DB.prepare(
      'INSERT INTO contacts (name, email, phone, message, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(name.trim(), email.trim(), phone?.trim() || null, message.trim(), ip).run()

    // Invia email a Patrizia
    const adminEmail = c.env.ADMIN_EMAIL || 'info@patriziabellavia.it'
    const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })

    if (c.env.RESEND_API_KEY) {
      await sendEmail({
        to: adminEmail,
        subject: `📩 Nuovo contatto da ${name.trim()} — patriziabellavia.it`,
        html: contactEmailHtml({ name: name.trim(), email: email.trim(), phone: phone?.trim(), message: message.trim(), date: now }),
        replyTo: email.trim()
      }, c.env.RESEND_API_KEY)
    }

    return c.json({ success: true, message: 'Messaggio inviato con successo!' })
  } catch (err) {
    console.error('Contact error:', err)
    return c.json({ success: false, error: 'Errore interno. Riprova più tardi.' }, 500)
  }
})

export default contact
