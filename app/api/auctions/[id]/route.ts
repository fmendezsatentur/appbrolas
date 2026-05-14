import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const BID_INCLUDE = {
  user: { select: { id: true, name: true, image: true } },
  reactions: { include: { user: { select: { id: true, name: true } } } },
} as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true, phone: true } },
      winner: { select: { id: true, name: true, phone: true } },
      bids: {
        include: BID_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!auction) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  // Auto-end if time passed
  if (auction.status === 'active' && new Date(auction.endTime) < new Date()) {
    const topBid = await prisma.bid.findFirst({
      where: { auctionId: id },
      orderBy: { amount: 'desc' },
    })
    const updated = await prisma.auction.update({
      where: { id },
      data: { status: 'ended', winnerId: topBid?.userId ?? null },
      include: {
        user: { select: { id: true, name: true, image: true, phone: true } },
        winner: { select: { id: true, name: true, phone: true } },
        bids: { include: BID_INCLUDE, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json(auction)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const auction = await prisma.auction.findFirst({ where: { id, userId: session.user.id } })
  if (!auction) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (auction.status !== 'active') return NextResponse.json({ error: 'No se puede eliminar una subasta finalizada' }, { status: 400 })
  if ((await prisma.bid.count({ where: { auctionId: id } })) > 0) {
    return NextResponse.json({ error: 'No se puede eliminar una subasta con ofertas' }, { status: 400 })
  }

  await prisma.auction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
