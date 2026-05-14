import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_EMOJIS = ['🔥', '👏', '🎉', '💰', '😮', '👑', '🤑', '🚀', '😂', '❤️']
const MAX_REACTIONS_PER_BID = 10

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { bidId } = await params
  const { emoji } = await request.json()

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Emoji no permitido' }, { status: 400 })
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } })
  if (!bid) return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })

  // Check if user already reacted (upsert replaces their previous emoji)
  const existing = await prisma.bidReaction.findUnique({
    where: { bidId_userId: { bidId, userId: session.user.id } },
  })

  // If not already reacted, check the 10-reaction cap
  if (!existing) {
    const count = await prisma.bidReaction.count({ where: { bidId } })
    if (count >= MAX_REACTIONS_PER_BID) {
      return NextResponse.json({ error: 'Límite de 10 reacciones por oferta' }, { status: 400 })
    }
  }

  await prisma.bidReaction.upsert({
    where: { bidId_userId: { bidId, userId: session.user.id } },
    update: { emoji },
    create: { bidId, userId: session.user.id, emoji },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { bidId } = await params

  await prisma.bidReaction.deleteMany({
    where: { bidId, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
