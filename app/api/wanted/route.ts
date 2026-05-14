import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const MAX_PER_USER = 5

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const seller = searchParams.get('seller')

  const listings = await prisma.wantedListing.findMany({
    where: seller ? { userId: seller } : { isActive: true },
    include: { user: { select: { id: true, name: true, image: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(listings)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  })
  if (!user?.phone) {
    return NextResponse.json({ error: 'Necesitás agregar tu WhatsApp antes de publicar.' }, { status: 400 })
  }

  const count = await prisma.wantedListing.count({
    where: { userId: session.user.id, isActive: true },
  })
  if (count >= MAX_PER_USER) {
    return NextResponse.json({ error: `Máximo ${MAX_PER_USER} búsquedas activas simultáneas` }, { status: 400 })
  }

  const { cardName, quantity, notes, imageUrl } = await request.json()
  if (!cardName) return NextResponse.json({ error: 'Falta el nombre de la carta' }, { status: 400 })

  const listing = await prisma.wantedListing.create({
    data: {
      userId: session.user.id,
      cardName,
      quantity: parseInt(quantity ?? '1'),
      notes: notes ?? null,
      imageUrl: imageUrl ?? null,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
