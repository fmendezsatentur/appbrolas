import { NextRequest, NextResponse } from 'next/server'
import { getCKMaps, lookupCKPrices } from '@/lib/cardkingdom'

export async function GET(request: NextRequest) {
  const name = new URL(request.url).searchParams.get('name')
  if (!name) return NextResponse.json({ data: [] })

  try {
    const [res, ckMaps] = await Promise.all([
      fetch(
        `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(name)}" include:extras&unique=prints&order=released`,
        { next: { revalidate: 3600 } }
      ),
      getCKMaps(),
    ])
    if (!res.ok) return NextResponse.json({ data: [] })

    const data = await res.json()

    const prints = (data.data ?? []).map((card: any) => ({
      id: card.id,
      name: card.name,
      set: card.set,
      set_name: card.set_name,
      collector_number: card.collector_number,
      imageUrl: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null,
      prices: lookupCKPrices(ckMaps, card.id, card.name),
      released_at: card.released_at,
      lang: card.lang,
      colors: card.color_identity ?? [],
    }))

    return NextResponse.json({ data: prints })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
