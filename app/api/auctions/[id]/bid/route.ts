import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { amount } = await request.json()

  const auction = await prisma.auction.findUnique({ where: { id } })
  if (!auction) return NextResponse.json({ error: 'Subasta no encontrada' }, { status: 404 })
  if (auction.status !== 'active') return NextResponse.json({ error: 'La subasta ya terminó' }, { status: 400 })
  if (new Date(auction.endTime) < new Date()) return NextResponse.json({ error: 'La subasta ya terminó' }, { status: 400 })
  if (auction.userId === session.user.id) return NextResponse.json({ error: 'No podés pujar en tu propia subasta' }, { status: 400 })

  const topBid = await prisma.bid.findFirst({
    where: { auctionId: id },
    orderBy: { amount: 'desc' },
  })
  if (topBid?.userId === session.user.id) {
    return NextResponse.json({ error: 'Ya tenés la oferta más alta' }, { status: 400 })
  }

  const minRequired = auction.currentPrice + auction.minIncrement
  if (amount < minRequired) {
    return NextResponse.json({ error: `La oferta mínima es $${minRequired}` }, { status: 400 })
  }

  // 5-min extension if less than 5 minutes remaining
  const now = new Date()
  const fiveMinutes = 5 * 60 * 1000
  let newEndTime = auction.endTime
  if (new Date(auction.endTime).getTime() - now.getTime() < fiveMinutes) {
    newEndTime = new Date(now.getTime() + fiveMinutes)
  }

  const [bid] = await prisma.$transaction([
    prisma.bid.create({
      data: { auctionId: id, userId: session.user.id, amount },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    prisma.auction.update({
      where: { id },
      data: { currentPrice: amount, endTime: newEndTime },
    }),
  ])

  return NextResponse.json(bid, { status: 201 })
}
