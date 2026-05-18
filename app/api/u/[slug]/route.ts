import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/slug'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, image: true, phone: true },
  })

  const user = allUsers.find(u => u.name && toSlug(u.name) === slug.toLowerCase())
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const [cards, sealed, auctions] = await Promise.all([
    prisma.cardListing.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sealedListing.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auction.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { endTime: 'asc' },
      include: { _count: { select: { bids: true } } },
    }),
  ])

  return NextResponse.json({ user, cards, sealed, auctions })
}
