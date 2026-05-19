import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

export async function sendPaymentNotification({
  to,
  sellerName,
  buyerName,
  buyerEmail,
  buyerPhone,
  items,
  total,
  appUrl,
}: {
  to: string
  sellerName: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  items: { cardName: string; quantity: number; price: number }[]
  total: number
  appUrl: string
}) {
  const transporter = getTransporter()
  if (!transporter) return

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  const itemRows = items.map(i =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #3f3f46;">${i.cardName}</td><td style="padding:6px 8px;border-bottom:1px solid #3f3f46;text-align:center;">x${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #3f3f46;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('')

  await transporter.sendMail({
    from: `"Magic Market" <${from}>`,
    to,
    subject: `✅ Pago recibido — ${buyerName} te compró cartas`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#18181b;color:#fafafa;border-radius:12px;overflow:hidden;">
        <div style="background:#1c1c24;padding:24px;text-align:center;border-bottom:2px solid #22c55e;">
          <h1 style="margin:0;font-size:22px;color:#22c55e;">✅ Pago confirmado</h1>
        </div>
        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 8px;font-size:18px;">¡Hola ${sellerName}!</h2>
          <p style="color:#a1a1aa;margin:0 0 20px;">
            <strong style="color:#fafafa;">${buyerName}</strong> pagó con Mercado Pago. El dinero ya está en tu cuenta.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
            <thead>
              <tr style="background:#27272a;">
                <th style="padding:8px;text-align:left;">Carta</th>
                <th style="padding:8px;text-align:center;">Cant.</th>
                <th style="padding:8px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px;text-align:right;font-weight:bold;">Total:</td>
                <td style="padding:8px;text-align:right;font-weight:bold;color:#22c55e;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background:#27272a;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">Datos del comprador</p>
            <p style="margin:4px 0;color:#a1a1aa;font-size:14px;">Nombre: <strong style="color:#fafafa;">${buyerName}</strong></p>
            <p style="margin:4px 0;color:#a1a1aa;font-size:14px;">Email: <strong style="color:#fafafa;">${buyerEmail}</strong></p>
            ${buyerPhone ? `<p style="margin:4px 0;color:#a1a1aa;font-size:14px;">WhatsApp: <strong style="color:#fafafa;">${buyerPhone}</strong></p>` : ''}
          </div>

          <a href="${appUrl}/mis-cartas" style="display:inline-block;background:#22c55e;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
            Ver mis ventas →
          </a>
        </div>
        <div style="padding:16px 24px;text-align:center;color:#52525b;font-size:12px;border-top:1px solid #27272a;">
          Magic Market · Comunidad de Magic
        </div>
      </div>
    `,
  })
}

export async function sendWishlistNotification({
  to,
  toName,
  cardName,
  sellerName,
  appUrl,
}: {
  to: string
  toName: string
  cardName: string
  sellerName: string
  appUrl: string
}) {
  const transporter = getTransporter()
  if (!transporter) return // SMTP not configured, silently skip

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  await transporter.sendMail({
    from: `"Magic Market" <${from}>`,
    to,
    subject: `🃏 ${cardName} ya está disponible en Magic Market`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #18181b; color: #fafafa; border-radius: 12px; overflow: hidden;">
        <div style="background: #1c1c24; padding: 24px; text-align: center; border-bottom: 2px solid #eab308;">
          <h1 style="margin: 0; font-size: 22px; color: #eab308;">🃏 Magic Market</h1>
        </div>
        <div style="padding: 28px 24px;">
          <h2 style="margin: 0 0 12px; font-size: 18px;">¡Hola ${toName}!</h2>
          <p style="color: #a1a1aa; margin: 0 0 20px;">
            Tenés en tu wishlist la carta <strong style="color: #fafafa;">${cardName}</strong> y acaba de aparecer en stock.
          </p>
          <div style="background: #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 15px;">
              📦 <strong>${cardName}</strong><br/>
              <span style="color: #a1a1aa; font-size: 13px;">Publicada por ${sellerName}</span>
            </p>
          </div>
          <a href="${appUrl}" style="display: inline-block; background: #eab308; color: #000; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">
            Ver en el marketplace →
          </a>
        </div>
        <div style="padding: 16px 24px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #27272a;">
          Magic Market · Comunidad de Magic
        </div>
      </div>
    `,
  })
}
