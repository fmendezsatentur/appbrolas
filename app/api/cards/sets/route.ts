import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json([])

  const rows = await prisma.cardListing.findMany({
    where: {
      isActive: true,
      setName: { contains: q, mode: 'insensitive', not: null },
    },
    select: { setName: true },
    distinct: ['setName'],
    take: 10,
    orderBy: { setName: 'asc' },
  })

  return NextResponse.json(rows.map(r => r.setName).filter(Boolean))
}
