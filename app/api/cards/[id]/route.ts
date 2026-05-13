import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.cardListing.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const updated = await prisma.cardListing.update({
    where: { id },
    data: {
      ...(body.price !== undefined && { price: parseFloat(body.price) }),
      ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.cardListing.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.cardListing.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
