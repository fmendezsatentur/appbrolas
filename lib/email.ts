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
