import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') ?? '6')
  if (!q) return NextResponse.json({ results: [] })

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=cards&order=name`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    const results = (data.data ?? []).slice(0, limit).map((c: {
      id: string
      name: string
      image_uris?: { normal?: string; small?: string }
      card_faces?: Array<{ image_uris?: { normal?: string; small?: string } }>
    }) => ({
      id: c.id,
      name: c.name,
      image: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? '',
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
