interface CKItem {
  name: string
  is_foil: string   // "true" | "false"
  price_retail: string
  scryfall_id?: string
}

interface CKCache {
  normal: Map<string, number>
  foil: Map<string, number>
  fetchedAt: number
}

let cache: CKCache | null = null
const TTL = 3_600_000

export async function getCKMaps(): Promise<{ normal: Map<string, number>; foil: Map<string, number> }> {
  if (cache && Date.now() - cache.fetchedAt < TTL) return cache

  try {
    const res = await fetch('https://api.cardkingdom.com/api/v2/pricelist', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return cache ?? { normal: new Map(), foil: new Map() }

    const json = await res.json()
    const normal = new Map<string, number>()
    const foil = new Map<string, number>()

    for (const item of (json.data ?? []) as CKItem[]) {
      const key = String(item.name).toLowerCase()
      const price = parseFloat(item.price_retail)
      if (!price || price <= 0) continue
      if (item.is_foil === 'true') { if (!foil.has(key)) foil.set(key, price) }
      else { if (!normal.has(key)) normal.set(key, price) }
    }

    cache = { normal, foil, fetchedAt: Date.now() }
    return cache
  } catch {
    return cache ?? { normal: new Map(), foil: new Map() }
  }
}
