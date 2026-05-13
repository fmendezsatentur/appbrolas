import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const seller = searchParams.get('seller')
  const condition = searchParams.get('condition')

  const listings = await prisma.cardListing.findMany({
    where: {
      isActive: true,
      ...(search && { cardName: { contains: search, mode: 'insensitive' } }),
      ...(seller && { userId: seller }),
      ...(condition && { condition }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(listings)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { cardName, setName, setCode, collectorNumber, condition, isFoil, quantity, price, priceRef, imageUrl, scryfallId, language, notes } = body

  if (!cardName || !price || !quantity) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const listing = await prisma.cardListing.create({
    data: {
      userId: session.user.id,
      cardName,
      setName,
      setCode,
      collectorNumber,
      condition: condition ?? 'NM',
      isFoil: isFoil ?? false,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      priceRef: priceRef ? parseFloat(priceRef) : null,
      imageUrl,
      scryfallId,
      language: language ?? 'en',
      notes,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
