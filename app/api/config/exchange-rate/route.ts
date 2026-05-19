import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'fmendezsatentur@gmail.com'
const KEY = 'usdToArs'
const DEFAULT_RATE = 1400

export async function GET() {
  const row = await prisma.appConfig.findUnique({ where: { key: KEY } })
  const rate = row ? parseFloat(row.value) : DEFAULT_RATE
  return NextResponse.json({ rate })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { rate } = await request.json()
  const parsed = parseFloat(rate)
  if (!parsed || parsed <= 0) {
    return NextResponse.json({ error: 'Tipo de cambio inválido' }, { status: 400 })
  }

  await prisma.appConfig.upsert({
    where: { key: KEY },
    update: { value: String(parsed) },
    create: { key: KEY, value: String(parsed) },
  })

  return NextResponse.json({ rate: parsed })
}
