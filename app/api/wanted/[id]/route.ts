import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const listing = await prisma.wantedListing.findFirst({ where: { id, userId: session.user.id } })
  if (!listing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.wantedListing.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
