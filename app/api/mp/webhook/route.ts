import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ ok: true }) }

  if (body.type !== 'payment') return NextResponse.json({ ok: true })

  const paymentId = body.data?.id
  const mpUserId = String(body.user_id ?? '')
  if (!paymentId) return NextResponse.json({ ok: true })

  try {
    // Find seller by MP user ID to get their access token
    const seller = await prisma.user.findFirst({
      where: { mpUserId },
      select: { mpAccessToken: true, name: true, email: true },
    })

    if (!seller?.mpAccessToken) return NextResponse.json({ ok: true })

    // Fetch payment details using seller's token
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${seller.mpAccessToken}` },
    })

    if (!paymentRes.ok) return NextResponse.json({ ok: true })
    const payment = await paymentRes.json()

    if (payment.status !== 'approved') return NextResponse.json({ ok: true })

    const orderIds: string[] = payment.metadata?.order_ids ?? []
    if (orderIds.length === 0) return NextResponse.json({ ok: true })

    // Mark orders as completed
    await prisma.order.updateMany({
      where: { id: { in: orderIds }, status: 'awaiting_payment' },
      data: { status: 'completed' },
    })

    // Send email to seller
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { buyer: { select: { name: true, email: true, phone: true } } },
    })

    if (orders.length > 0 && seller.email) {
      const buyer = orders[0].buyer
      const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://magic.brolas.com.ar'

      // fire-and-forget
      sendPaymentNotification({
        to: seller.email,
        sellerName: seller.name ?? 'Vendedor',
        buyerName: buyer.name ?? 'Comprador',
        buyerEmail: buyer.email,
        buyerPhone: buyer.phone,
        items: orders.map(o => ({ cardName: o.cardName, quantity: o.quantity, price: o.price })),
        total: payment.transaction_amount,
        appUrl,
      }).catch(console.error)
    }
  } catch (e) {
    console.error('MP webhook error:', e)
  }

  return NextResponse.json({ ok: true })
}
