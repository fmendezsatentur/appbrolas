import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { cardName } = await request.json()
  if (!cardName?.trim()) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })

  const item = await prisma.wishlistItem.upsert({
    where: { userId_cardName: { userId: session.user.id, cardName: cardName.trim() } },
    update: {},
    create: { userId: session.user.id, cardName: cardName.trim() },
  })

  return NextResponse.json(item, { status: 201 })
}
