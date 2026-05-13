import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const name = new URL(request.url).searchParams.get('name')
  if (!name) return NextResponse.json({ data: [] })

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(name)}"&unique=prints&order=released`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ data: [] })
    const data = await res.json()

    const prints = (data.data ?? []).map((card: any) => ({
      id: card.id,
      name: card.name,
      set: card.set,
      set_name: card.set_name,
      collector_number: card.collector_number,
      imageUrl: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null,
      prices: card.prices,
      released_at: card.released_at,
      lang: card.lang,
    }))

    return NextResponse.json({ data: prints })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
