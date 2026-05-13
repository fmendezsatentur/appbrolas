import { NextRequest, NextResponse } from 'next/server'
import { searchCardByName } from '@/lib/scryfall'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const set = searchParams.get('set')
  const number = searchParams.get('number')

  if (set && number) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/${set.toLowerCase()}/${encodeURIComponent(number)}`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) {
        // Fallback: si no encuentra por set+número, intentar por nombre si viene
        if (name) {
          const card = await searchCardByName(name)
          if (card) return NextResponse.json(card)
        }
        return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 })
      }
      return NextResponse.json(await res.json())
    } catch {
      return NextResponse.json({ error: 'Error buscando carta' }, { status: 500 })
    }
  }

  if (!name) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })

  const card = await searchCardByName(name)
  if (!card) return NextResponse.json({ error: 'Carta no encontrada' }, { status: 404 })

  return NextResponse.json(card)
}
