import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const role = new URL(request.url).searchParams.get('role') ?? 'seller'

  const orders = await prisma.order.findMany({
    where: role === 'buyer'
      ? { buyerId: session.user.id }
      : { sellerId: session.user.id },
    include: {
      buyer: { select: { id: true, name: true, image: true, phone: true } },
      seller: { select: { id: true, name: true, image: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
