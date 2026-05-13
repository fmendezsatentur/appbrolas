import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { listingIds } = await request.json()
  if (!Array.isArray(listingIds) || listingIds.length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Pause listings that belong to OTHER users (not the buyer's own)
  await prisma.cardListing.updateMany({
    where: {
      id: { in: listingIds },
      userId: { not: session.user.id },
    },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
