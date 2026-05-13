import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ data: [] })

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return NextResponse.json({ data: data.data?.slice(0, 8) ?? [] })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
