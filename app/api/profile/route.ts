import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, phone: true, mpUserId: true },
  })
  if (!user) return NextResponse.json(null)
  const { mpUserId, ...rest } = user
  return NextResponse.json({ ...rest, mpConnected: !!mpUserId })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { phone } = await request.json()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: phone?.trim() || null },
    select: { id: true, name: true, phone: true },
  })
  return NextResponse.json(user)
}
