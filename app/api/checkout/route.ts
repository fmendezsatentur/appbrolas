import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { listingIds } = await request.json()
  if (!Array.isArray(listingIds) || listingIds.length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Fetch listings to get seller info for order records
  const listings = await prisma.cardListing.findMany({
    where: {
      id: { in: listingIds },
      userId: { not: session.user.id }, // can't buy from yourself
    },
  })

  if (listings.length === 0) return NextResponse.json({ ok: true })

  // Create one Order per listing item
  await prisma.order.createMany({
    data: listings.map((l) => ({
      buyerId: session.user.id,
      sellerId: l.userId,
      listingId: l.id,
      cardName: l.cardName,
      setName: l.setName ?? undefined,
      imageUrl: l.imageUrl ?? undefined,
      quantity: l.quantity,
      price: l.price,
      condition: l.condition,
      isFoil: l.isFoil,
      status: 'pending',
    })),
  })

  // Pause the listings
  await prisma.cardListing.updateMany({
    where: { id: { in: listings.map((l) => l.id) } },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
