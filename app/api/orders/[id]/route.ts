import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { status } = await request.json()

  if (!['completed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: { id, sellerId: session.user.id },
  })
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  })

  // Reactivate listing if cancelled (venta no concretada)
  if (status === 'cancelled') {
    await prisma.cardListing.updateMany({
      where: { id: order.listingId },
      data: { isActive: true },
    })
  }

  // If completed: listing stays paused (already isActive: false)

  return NextResponse.json(updated)
}
