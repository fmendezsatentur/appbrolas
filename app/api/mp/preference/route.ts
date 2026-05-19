import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { listingIds, sellerId } = await request.json()
  if (!Array.isArray(listingIds) || !sellerId) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const [seller, buyer, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { mpAccessToken: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    prisma.cardListing.findMany({
      where: { id: { in: listingIds }, userId: sellerId, isActive: true },
    }),
  ])

  if (!seller?.mpAccessToken) {
    return NextResponse.json({ error: 'El vendedor no tiene Mercado Pago configurado' }, { status: 400 })
  }
  if (listings.length === 0) {
    return NextResponse.json({ error: 'Las cartas ya no están disponibles' }, { status: 400 })
  }

  // Create orders with 'awaiting_payment' status
  const createdOrders = await Promise.all(
    listings.map(l =>
      prisma.order.create({
        data: {
          buyerId: session.user.id,
          sellerId,
          listingId: l.id,
          cardName: l.cardName,
          setName: l.setName ?? undefined,
          imageUrl: l.imageUrl ?? undefined,
          quantity: l.quantity,
          price: l.price,
          condition: l.condition,
          isFoil: l.isFoil,
          status: 'awaiting_payment',
        },
      })
    )
  )

  // Pause listings while payment is pending
  await prisma.cardListing.updateMany({
    where: { id: { in: listingIds } },
    data: { isActive: false },
  })

  // Fetch exchange rate
  const rateRow = await prisma.appConfig.findUnique({ where: { key: 'usdToArs' } })
  const exchangeRate = rateRow ? parseFloat(rateRow.value) : 1400

  // Create MP preference using seller's access token
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://magic.brolas.com.ar'

  const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${seller.mpAccessToken}`,
    },
    body: JSON.stringify({
      items: listings.map(l => ({
        title: l.cardName + (l.isFoil ? ' (Foil)' : ''),
        quantity: l.quantity,
        unit_price: Math.round(l.price * exchangeRate),
        currency_id: 'ARS',
      })),
      payer: {
        name: buyer?.name ?? '',
        email: buyer?.email ?? '',
      },
      back_urls: {
        success: `${appUrl}/mis-cartas?mp=success`,
        failure: `${appUrl}/carrito?mp=failure`,
        pending: `${appUrl}/mis-cartas?mp=pending`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/mp/webhook`,
      metadata: {
        order_ids: createdOrders.map(o => o.id),
        buyer_id: session.user.id,
        seller_id: sellerId,
      },
      statement_descriptor: 'Magic Market',
    }),
  })

  if (!preferenceRes.ok) {
    // Rollback
    await Promise.all([
      prisma.order.deleteMany({ where: { id: { in: createdOrders.map(o => o.id) } } }),
      prisma.cardListing.updateMany({ where: { id: { in: listingIds } }, data: { isActive: true } }),
    ])
    const err = await preferenceRes.text()
    console.error('MP preference error:', err)
    return NextResponse.json({ error: 'Error al crear la preferencia de pago' }, { status: 500 })
  }

  const preference = await preferenceRes.json()
  return NextResponse.json({ initPoint: preference.init_point })
}
