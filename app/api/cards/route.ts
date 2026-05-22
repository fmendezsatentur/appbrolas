import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWishlistNotification } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const seller = searchParams.get('seller')
  const sellerName = searchParams.get('sellerName')
  const condition = searchParams.get('condition')
  const color = searchParams.get('color')
  const setName = searchParams.get('setName')
  const sort = searchParams.get('sort') ?? 'newest'
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : null
  const PAGE_SIZE = 60

  // When fetching own listings, skip isActive filter so paused listings are visible
  const session = await auth()
  const isOwnListings = !!(seller && seller === session?.user?.id)

  const orderBy =
    sort === 'price_asc'  ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    { createdAt: 'desc' as const }

  const where = {
    ...(!isOwnListings && { isActive: true }),
    ...(search && { cardName: { contains: search, mode: 'insensitive' as const } }),
    ...(seller && { userId: seller }),
    ...(sellerName && { user: { name: { contains: sellerName, mode: 'insensitive' as const } } }),
    ...(condition && { condition }),
    ...(color === 'C' ? { colors: { isEmpty: true } } : color ? { colors: { has: color } } : {}),
    ...(setName && { setName: { contains: setName, mode: 'insensitive' as const } }),
  }

  const [listings, total] = page !== null
    ? await Promise.all([
        prisma.cardListing.findMany({
          where, include: { user: { select: { id: true, name: true, email: true, image: true, phone: true, mpUserId: true } } },
          orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
        }),
        prisma.cardListing.count({ where }),
      ])
    : [
        await prisma.cardListing.findMany({
          where, include: { user: { select: { id: true, name: true, email: true, image: true, phone: true, mpUserId: true } } },
          orderBy,
        }),
        null,
      ]

  const mapped = listings.map(({ user, ...l }) => ({
    ...l,
    user: { id: user.id, name: user.name, email: user.email, image: user.image, phone: user.phone, mpConnected: !!user.mpUserId },
  }))

  if (page !== null) {
    return NextResponse.json({ data: mapped, total, pages: Math.ceil((total ?? 0) / PAGE_SIZE) })
  }
  return NextResponse.json(mapped)
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
    if (count >= 1000) {
      return NextResponse.json(
        { error: 'Límite de 1000 cartas por usuario. Eliminá alguna antes de publicar más.' },
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

  // Fire-and-forget: notify users who have this card in their wishlist
  ;(async () => {
    try {
      const wishers = await prisma.wishlistItem.findMany({
        where: { cardName: { equals: cardName.trim(), mode: 'insensitive' } },
        include: { user: { select: { email: true, name: true } } },
      })
      const seller = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      })
      const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://magic.brolas.com.ar'
      for (const w of wishers) {
        if (w.userId === session.user.id) continue // no notificar al mismo vendedor
        await sendWishlistNotification({
          to: w.user.email,
          toName: w.user.name ?? 'Jugador',
          cardName: listing.cardName,
          sellerName: seller?.name ?? 'alguien',
          appUrl,
        })
      }
    } catch {}
  })()

  return NextResponse.json(listing, { status: 201 })
}
