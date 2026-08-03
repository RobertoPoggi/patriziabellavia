// ============================================================
// Email via Resend API
// Docs: https://resend.com/docs/api-reference/emails/send-email
// ============================================================

export interface EmailPayload {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(payload: EmailPayload, resendApiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Sito Patrizia Bellavia <noreply@patriziabellavia.it>',
        to: [payload.to],
        reply_to: payload.replyTo,
        subject: payload.subject,
        html: payload.html
      })
    })
    return res.ok
  } catch {
    return false
  }
}

export function contactEmailHtml(data: {
  name: string
  email: string
  phone?: string
  message: string
  date: string
}): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .card { background: white; max-width: 560px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #638290; color: white; padding: 24px 28px; }
  .header h2 { margin: 0; font-size: 18px; }
  .body { padding: 28px; }
  .field { margin-bottom: 16px; }
  .label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 15px; color: #222; }
  .message-box { background: #f9f9f9; border-left: 3px solid #638290; padding: 14px 16px; border-radius: 4px; font-size: 15px; color: #333; }
  .footer { background: #f5f5f5; padding: 16px 28px; font-size: 12px; color: #aaa; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <h2>📩 Nuovo messaggio dal sito</h2>
      <div style="font-size:13px;opacity:0.85;margin-top:4px">${data.date}</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Nome e Cognome</div>
        <div class="value"><strong>${data.name}</strong></div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${data.email}" style="color:#638290">${data.email}</a></div>
      </div>
      ${data.phone ? `<div class="field">
        <div class="label">Telefono</div>
        <div class="value"><a href="tel:${data.phone}" style="color:#638290">${data.phone}</a></div>
      </div>` : ''}
      <div class="field">
        <div class="label">Messaggio</div>
        <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      Messaggio inviato tramite patriziabellavia.it — Rispondi direttamente a <a href="mailto:${data.email}">${data.email}</a>
    </div>
  </div>
</body>
</html>`
}
