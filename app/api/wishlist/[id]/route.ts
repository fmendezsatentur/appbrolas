import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const item = await prisma.wishlistItem.findUnique({ where: { id } })
  if (!item || item.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.wishlistItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
