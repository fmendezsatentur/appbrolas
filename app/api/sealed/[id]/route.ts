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
  const body = await request.json()

  const existing = await prisma.sealedListing.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updated = await prisma.sealedListing.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.price !== undefined && { price: parseFloat(body.price) }),
      ...(body.tag !== undefined && { tag: body.tag }),
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
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.sealedListing.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.sealedListing.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
