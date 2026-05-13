export interface ParsedCard {
  quantity: number
  name: string
  setCode?: string
  collectorNumber?: string
}

// Parsea el formato exportado de Moxfield/MTGO/Arena:
// "4 Lightning Bolt"
// "4 Lightning Bolt (M11) 149"
// "4x Lightning Bolt"
export function parseCardList(text: string): ParsedCard[] {
  const lines = text.split('\n')
  const cards: ParsedCard[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith('#')) continue

    // Formato con set y número: "4 Lightning Bolt (M11) 149"
    const withSetMatch = line.match(/^(\d+)x?\s+(.+?)\s+\(([A-Z0-9]+)\)\s+(\d+)$/i)
    if (withSetMatch) {
      cards.push({
        quantity: parseInt(withSetMatch[1]),
        name: withSetMatch[2].trim(),
        setCode: withSetMatch[3].toUpperCase(),
        collectorNumber: withSetMatch[4],
      })
      continue
    }

    // Formato simple: "4 Lightning Bolt" o "4x Lightning Bolt"
    const simpleMatch = line.match(/^(\d+)x?\s+(.+)$/)
    if (simpleMatch) {
      cards.push({
        quantity: parseInt(simpleMatch[1]),
        name: simpleMatch[2].trim(),
      })
    }
  }

  return cards
}

// Extrae el deck ID de una URL de Moxfield
export function extractMoxfieldDeckId(url: string): string | null {
  const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// Obtiene las cartas de un deck de Moxfield via su API pública
export async function fetchMoxfieldDeck(deckId: string): Promise<ParsedCard[]> {
  try {
    const res = await fetch(`https://api2.moxfield.com/v2/decks/all/${deckId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    })
    if (!res.ok) throw new Error('Moxfield request failed')

    const data = await res.json()
    const cards: ParsedCard[] = []

    const sections = ['mainboard', 'sideboard', 'maybeboard']
    for (const section of sections) {
      const board = data.boards?.[section]?.cards
      if (!board) continue
      for (const entry of Object.values(board) as any[]) {
        cards.push({
          quantity: entry.quantity,
          name: entry.card?.name ?? '',
          setCode: entry.card?.set?.toUpperCase(),
          collectorNumber: entry.card?.cn,
        })
      }
    }

    return cards.filter((c) => c.name)
  } catch {
    return []
  }
}
