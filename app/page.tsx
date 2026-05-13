'use client'
import * as React from 'react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { CardItem, type ListingWithUser } from '@/components/CardItem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { CartItem } from '@/components/ui/shopping-cart'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG']

export default function MarketplacePage() {
  const [listings, setListings] = React.useState<ListingWithUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [condition, setCondition] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const suggestDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = (q: string) => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current)
    if (q.length < 2) { setSuggestions([]); return }
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cards?search=${encodeURIComponent(q)}`)
        const data: ListingWithUser[] = await res.json()
        const names = [...new Set(data.map((l) => l.cardName))].slice(0, 6)
        setSuggestions(names)
        setShowSuggestions(names.length > 0)
      } catch { setSuggestions([]) }
    }, 200)
  }
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('magic-cart') ?? '[]')
    } catch {
      return []
    }
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magic-cart', JSON.stringify(cart))
    }
  }, [cart])

  const fetchListings = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (condition) params.set('condition', condition)
      const res = await fetch(`/api/cards?${params}`)
      const data = await res.json()
      setListings(data)
    } finally {
      setLoading(false)
    }
  }, [search, condition])

  React.useEffect(() => {
    const t = setTimeout(fetchListings, 300)
    return () => clearTimeout(t)
  }, [fetchListings])

  const addToCart = (listing: ListingWithUser) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id)
      if (existing) {
        if (existing.quantity >= listing.quantity) {
          toast.error('No hay más stock disponible')
          return prev
        }
        return prev.map((i) =>
          i.listingId === listing.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        name: listing.cardName,
        price: listing.price,
        quantity: 1,
        maxQuantity: listing.quantity,
        imageUrl: listing.imageUrl ?? '',
        sellerName: listing.user.name ?? 'Vendedor',
        condition: listing.condition,
        isFoil: listing.isFoil,
      }
      toast.success(`${listing.cardName} agregada al carrito`)
      return [...prev, newItem]
    })
  }

  const cartItemIds = new Set(cart.map((i) => i.listingId))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            {listings.length} cartas disponibles
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); fetchSuggestions(e.target.value) }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
              placeholder="Buscar carta..."
              className="pl-9"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-popover rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onMouseDown={() => { setSearch(s); setShowSuggestions(false) }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {CONDITIONS.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={condition === c ? 'default' : 'outline'}
                onClick={() => setCondition((prev) => (prev === c ? null : c))}
              >
                {c}
              </Button>
            ))}
            {condition && (
              <Button size="sm" variant="ghost" onClick={() => setCondition(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No hay cartas disponibles</p>
            <p className="text-sm mt-1">
              {search || condition ? 'Probá con otros filtros' : 'Sé el primero en publicar una carta'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {listings.map((listing) => (
              <CardItem
                key={listing.id}
                listing={listing}
                onAddToCart={addToCart}
                isInCart={cartItemIds.has(listing.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
