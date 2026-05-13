import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const seller = searchParams.get('seller')
  const sellerName = searchParams.get('sellerName')
  const condition = searchParams.get('condition')
  const color = searchParams.get('color')
  const sort = searchParams.get('sort') ?? 'newest'

  const orderBy =
    sort === 'price_asc'  ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    { createdAt: 'desc' as const }

  const listings = await prisma.cardListing.findMany({
    where: {
      isActive: true,
      ...(search && { cardName: { contains: search, mode: 'insensitive' } }),
      ...(seller && { userId: seller }),
      ...(sellerName && { user: { name: { contains: sellerName, mode: 'insensitive' } } }),
      ...(condition && { condition }),
      ...(color && { colors: { has: color } }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, phone: true } },
    },
    orderBy,
  })

  return NextResponse.json(listings)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, email: true },
  })
  if (!user?.phone) {
    return NextResponse.json(
      { error: 'Necesitás agregar tu número de WhatsApp en tu perfil antes de publicar cartas.' },
      { status: 400 }
    )
  }

  const ADMIN_EMAIL = 'fmendezsatentur@gmail.com'
  if (user.email !== ADMIN_EMAIL) {
    const count = await prisma.cardListing.count({ where: { userId: session.user.id } })
    if (count >= 50) {
      return NextResponse.json(
        { error: 'Límite de 50 cartas por usuario. Eliminá alguna antes de publicar más.' },
        { status: 400 }
      )
    }
  }

  const body = await request.json()
  const { cardName, setName, setCode, collectorNumber, condition, isFoil, quantity, price, priceRef, imageUrl, scryfallId, colors, language, notes } = body

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
      colors: colors ?? [],
      language: language ?? 'en',
      notes,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
