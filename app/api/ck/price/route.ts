import { NextRequest, NextResponse } from 'next/server'
import { getCKMaps } from '@/lib/cardkingdom'

export async function GET(request: NextRequest) {
  const name = new URL(request.url).searchParams.get('name') ?? ''
  if (!name) return NextResponse.json({ retail: null, retail_foil: null })

  const maps = await getCKMaps()
  const key = name.toLowerCase()
  return NextResponse.json({
    retail: maps.normalByName.get(key) ?? null,
    retail_foil: maps.foilByName.get(key) ?? null,
  })
}

// POST { names: string[] } → Record<name, { retail, retail_foil }>
export async function POST(request: NextRequest) {
  const { names } = await request.json()
  if (!Array.isArray(names)) return NextResponse.json({})

  const maps = await getCKMaps()
  const result: Record<string, { retail: number | null; retail_foil: number | null }> = {}
  for (const name of names as string[]) {
    const key = name.toLowerCase()
    result[name] = {
      retail: maps.normalByName.get(key) ?? null,
      retail_foil: maps.foilByName.get(key) ?? null,
    }
  }
  return NextResponse.json(result)
}
