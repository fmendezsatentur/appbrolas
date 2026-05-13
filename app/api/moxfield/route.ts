import { NextRequest, NextResponse } from 'next/server'
import { parseCardList, extractMoxfieldDeckId, fetchMoxfieldDeck } from '@/lib/moxfield'

export async function POST(request: NextRequest) {
  const { text, url } = await request.json()

  // Si viene URL de Moxfield, intentamos la API
  if (url) {
    const deckId = extractMoxfieldDeckId(url)
    if (!deckId) {
      return NextResponse.json({ error: 'URL de Moxfield inválida' }, { status: 400 })
    }
    const cards = await fetchMoxfieldDeck(deckId)
    if (cards.length > 0) {
      return NextResponse.json({ cards })
    }
    return NextResponse.json({ error: 'No se pudo obtener el deck. Usá el texto exportado.' }, { status: 422 })
  }

  // Si viene texto, lo parseamos
  if (text) {
    const cards = parseCardList(text)
    return NextResponse.json({ cards })
  }

  return NextResponse.json({ error: 'Enviá text o url' }, { status: 400 })
}
