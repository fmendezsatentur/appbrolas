interface CKItem {
  name: string
  is_foil: string   // "true" | "false"
  price_retail: string
  scryfall_id?: string
}

export interface CKMaps {
  normalById: Map<string, number>   // scryfall_id → retail (non-foil)
  foilById: Map<string, number>     // scryfall_id → retail (foil)
  normalByName: Map<string, number> // name.lower → retail (fallback)
  foilByName: Map<string, number>   // name.lower → retail foil (fallback)
}

interface CKCache extends CKMaps { fetchedAt: number }

let cache: CKCache | null = null
const TTL = 3_600_000

const EMPTY: CKMaps = {
  normalById: new Map(), foilById: new Map(),
  normalByName: new Map(), foilByName: new Map(),
}

export async function getCKMaps(): Promise<CKMaps> {
  if (cache && Date.now() - cache.fetchedAt < TTL) return cache

  try {
    const res = await fetch('https://api.cardkingdom.com/api/v2/pricelist', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return cache ?? EMPTY

    const json = await res.json()
    const normalById = new Map<string, number>()
    const foilById = new Map<string, number>()
    const normalByName = new Map<string, number>()
    const foilByName = new Map<string, number>()

    for (const item of (json.data ?? []) as CKItem[]) {
      const price = parseFloat(item.price_retail)
      if (!price || price <= 0) continue

      const nameKey = String(item.name).toLowerCase()
      const isFoil = item.is_foil === 'true'

      if (item.scryfall_id) {
        if (isFoil) foilById.set(item.scryfall_id, price)
        else normalById.set(item.scryfall_id, price)
      }
      // Name fallback: keep first occurrence (typically cheapest/most common edition)
      if (isFoil) { if (!foilByName.has(nameKey)) foilByName.set(nameKey, price) }
      else { if (!normalByName.has(nameKey)) normalByName.set(nameKey, price) }
    }

    cache = { normalById, foilById, normalByName, foilByName, fetchedAt: Date.now() }
    return cache
  } catch {
    return cache ?? EMPTY
  }
}

export function lookupCKPrices(
  maps: CKMaps, scryfallId: string, name: string
): { retail: number | null; retail_foil: number | null } {
  const nameKey = name.toLowerCase()
  return {
    retail: maps.normalById.get(scryfallId) ?? maps.normalByName.get(nameKey) ?? null,
    retail_foil: maps.foilById.get(scryfallId) ?? maps.foilByName.get(nameKey) ?? null,
  }
}
