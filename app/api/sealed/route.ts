import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const seller = searchParams.get('seller')
  const tag = searchParams.get('tag')
  const sort = searchParams.get('sort') ?? 'newest'

  const orderBy =
    sort === 'price_asc'  ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    { createdAt: 'desc' as const }

  const listings = await prisma.sealedListing.findMany({
    where: {
      isActive: true,
      ...(seller && { userId: seller }),
      ...(tag && { tag }),
    },
    include: {
      user: { select: { id: true, name: true, image: true, phone: true } },
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
    select: { phone: true },
  })
  if (!user?.phone) {
    return NextResponse.json(
      { error: 'Necesitás agregar tu número de WhatsApp en tu perfil antes de publicar.' },
      { status: 400 }
    )
  }

  const { title, description, imageUrl, price, tag } = await request.json()
  if (!title || !price) {
    return NextResponse.json({ error: 'Título y precio son requeridos' }, { status: 400 })
  }

  const listing = await prisma.sealedListing.create({
    data: {
      userId: session.user.id,
      title,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      price: parseFloat(price),
      tag: tag ?? 'OTROS',
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
