import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'fmendezsatentur@gmail.com'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export async function GET() {
  const session = await auth()
  const user = session?.user?.email
  if (user !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const now = new Date()
  const ago7  = daysAgo(7)
  const ago30 = daysAgo(30)

  const [
    totalUsers, newUsers7, newUsers30,
    totalCards, activeCards, newCards7,
    totalSealed, activeSealed,
    orders,
    totalAuctions, activeAuctions, totalBids,
    totalWishlist, wishlistUsers,
    totalWanted,
    topSellers,
    recentUsers, recentCards, recentOrders, recentAuctions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: ago7 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago30 } } }),

    prisma.cardListing.count(),
    prisma.cardListing.count({ where: { isActive: true } }),
    prisma.cardListing.count({ where: { createdAt: { gte: ago7 } } }),

    prisma.sealedListing.count(),
    prisma.sealedListing.count({ where: { isActive: true } }),

    prisma.order.findMany({
      select: { status: true, price: true, quantity: true, createdAt: true },
    }),

    prisma.auction.count(),
    prisma.auction.count({ where: { status: 'active' } }),
    prisma.bid.count(),

    prisma.wishlistItem.count(),
    prisma.wishlistItem.groupBy({ by: ['userId'], _count: true }).then(r => r.length),

    prisma.wantedListing.count({ where: { isActive: true } }),

    prisma.cardListing.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }).then(async (rows) => {
      const ids = rows.map(r => r.userId)
      const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } })
      const map = Object.fromEntries(users.map(u => [u.id, u]))
      return rows.map(r => ({ name: map[r.userId]?.name ?? map[r.userId]?.email ?? r.userId, count: r._count.id }))
    }),

    // Actividad reciente
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 15, select: { name: true, email: true, createdAt: true } }),
    prisma.cardListing.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { user: { select: { name: true } } } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { buyer: { select: { name: true } }, seller: { select: { name: true } } } }),
    prisma.auction.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
  ])

  const completedOrders = orders.filter(o => o.status === 'completed')
  const revenue = completedOrders.reduce((s, o) => s + o.price * o.quantity, 0)
  const revenue30 = orders
    .filter(o => o.status === 'completed' && new Date(o.createdAt) >= ago30)
    .reduce((s, o) => s + o.price * o.quantity, 0)

  // Armar feed de actividad unificado
  const activity = [
    ...recentUsers.map(u => ({
      type: 'new_user' as const,
      label: `Nuevo usuario: ${u.name ?? u.email}`,
      at: u.createdAt,
    })),
    ...recentCards.map(c => ({
      type: 'new_card' as const,
      label: `${c.user.name ?? '?'} publicó ${c.cardName}${c.isFoil ? ' (Foil)' : ''} — $${c.price.toFixed(2)}`,
      at: c.createdAt,
    })),
    ...recentOrders.map(o => ({
      type: 'new_order' as const,
      label: `Orden ${o.status}: ${o.cardName} · ${o.buyer.name ?? '?'} → ${o.seller.name ?? '?'} · $${(o.price * o.quantity).toFixed(2)}`,
      at: o.createdAt,
    })),
    ...recentAuctions.map(a => ({
      type: 'new_auction' as const,
      label: `${a.user.name ?? '?'} creó subasta: ${a.title}`,
      at: a.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40)

  return NextResponse.json({
    users:    { total: totalUsers, last7: newUsers7, last30: newUsers30 },
    cards:    { total: totalCards, active: activeCards, last7: newCards7 },
    sealed:   { total: totalSealed, active: activeSealed },
    orders:   {
      total: orders.length,
      pending:   orders.filter(o => o.status === 'pending').length,
      completed: completedOrders.length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue,
      revenue30,
    },
    auctions: { total: totalAuctions, active: activeAuctions, totalBids },
    wishlist: { total: totalWishlist, users: wishlistUsers },
    wanted:   { total: totalWanted },
    topSellers,
    activity,
  })
}
