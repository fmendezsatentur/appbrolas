import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { identifiers } = await request.json()
  if (!Array.isArray(identifiers) || identifiers.length === 0) {
    return NextResponse.json({ data: [], not_found: [] })
  }

  try {
    const res = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers: identifiers.slice(0, 75) }),
    })
    if (!res.ok) return NextResponse.json({ data: [], not_found: identifiers })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ data: [], not_found: identifiers })
  }
}
