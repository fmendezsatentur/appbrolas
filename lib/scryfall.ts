export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  collector_number: string
  image_uris?: {
    normal: string
    large: string
    small: string
  }
  card_faces?: Array<{
    image_uris?: { normal: string; large: string; small: string }
  }>
  prices: {
    usd: string | null
    usd_foil: string | null
    eur: string | null
  }
  purchase_uris: {
    tcgplayer?: string
    cardmarket?: string
    cardhoarder?: string
  }
  lang: string
}

export async function searchCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function searchCards(query: string): Promise<ScryfallCard[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export function getCardImageUrl(card: ScryfallCard): string {
  if (card.image_uris?.normal) return card.image_uris.normal
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal
  return '/card-placeholder.png'
}

export function getCardPrice(card: ScryfallCard, foil = false): number | null {
  const priceStr = foil ? card.prices.usd_foil : card.prices.usd
  if (!priceStr) return null
  return parseFloat(priceStr)
}
