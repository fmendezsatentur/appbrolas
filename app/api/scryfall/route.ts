import { NextRequest, NextResponse } from 'next/server'
import { searchCardByName } from '@/lib/scryfall'

export async function GET(request: NextRequest) {
  const name = new URL(request.url).searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })

  const card = await searchCardByName(name)
  if (!card) return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 })

  return NextResponse.json(card)
}
