import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const seller = searchParams.get('seller')
  const status = searchParams.get('status') ?? 'active'

  // Auto-end auctions whose time has passed
  await prisma.auction.updateMany({
    where: { status: 'active', endTime: { lt: new Date() } },
    data: { status: 'ended' },
  })

  const auctions = await prisma.auction.findMany({
    where: {
      ...(seller ? { userId: seller } : { status }),
    },
    include: {
      user: { select: { id: true, name: true, image: true, phone: true } },
      winner: { select: { id: true, name: true, phone: true } },
      _count: { select: { bids: true } },
    },
    orderBy: { endTime: 'asc' },
  })

  return NextResponse.json(auctions)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  })
  if (!user?.phone) {
    return NextResponse.json({ error: 'Necesitás agregar tu WhatsApp antes de crear una subasta.' }, { status: 400 })
  }

  const { title, description, imageUrl, startingPrice, minIncrement, endTime } = await request.json()
  if (!title || !startingPrice || !endTime) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const end = new Date(endTime)
  const maxEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  if (end > maxEnd) return NextResponse.json({ error: 'Máximo 3 días' }, { status: 400 })
  if (end <= new Date()) return NextResponse.json({ error: 'La fecha debe ser en el futuro' }, { status: 400 })

  const auction = await prisma.auction.create({
    data: {
      userId: session.user.id,
      title,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      minIncrement: parseFloat(minIncrement ?? '1'),
      endTime: end,
    },
  })

  return NextResponse.json(auction, { status: 201 })
}
