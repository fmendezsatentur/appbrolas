'use client'
import * as React from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'
import { CardItem, type ListingWithUser } from '@/components/CardItem'
import { SealedItem, type SealedListingWithUser } from '@/components/SealedItem'
import AuctionCard, { type AuctionWithMeta } from '@/components/AuctionCard'
import WantedCard, { type WantedListingWithUser } from '@/components/WantedCard'
import AddWantedDialog from '@/components/AddWantedDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, ArrowUpDown } from 'lucide-react'
import type { CartItem } from '@/components/ui/shopping-cart'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG']
const SEALED_TAGS = ['SOBRES', 'MAZO COMMANDER', 'MAZO PAUPER', 'BUNDLE', 'PRECON', 'OTROS']
const COLORS = [
  { code: 'W', label: 'Blanco', bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', symbol: '☀' },
  { code: 'U', label: 'Azul',   bg: 'bg-blue-500',   border: 'border-blue-700',   text: 'text-white',      symbol: '💧' },
  { code: 'B', label: 'Negro',  bg: 'bg-gray-800',   border: 'border-gray-600',   text: 'text-gray-100',   symbol: '💀' },
  { code: 'R', label: 'Rojo',   bg: 'bg-red-600',    border: 'border-red-800',    text: 'text-white',      symbol: '🔥' },
  { code: 'G', label: 'Verde',  bg: 'bg-green-600',  border: 'border-green-800',  text: 'text-white',      symbol: '🌲' },
]

type GroupedListing = ListingWithUser & { allIds: string[] }
type Tab = 'cards' | 'sealed' | 'auctions' | 'wanted'
type Sort = 'newest' | 'price_asc' | 'price_desc'

export default function MarketplacePage() {
  const { data: session } = useSession()
  const [tab, setTab] = React.useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab')
      if (p === 'subastas') return 'auctions'
      if (p === 'sealed') return 'sealed'
      if (p === 'wanted') return 'wanted'
    }
    return 'cards'
  })
  const [sort, setSort] = React.useState<Sort>('newest')

  // Card filters
  const [listings, setListings] = React.useState<ListingWithUser[]>([])
  const [loadingCards, setLoadingCards] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [condition, setCondition] = React.useState<string | null>(null)
  const [color, setColor] = React.useState<string | null>(null)
  const [sellerSearch, setSellerSearch] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const suggestDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sealed filters
  const [sealed, setSealed] = React.useState<SealedListingWithUser[]>([])
  const [loadingSealed, setLoadingSealed] = React.useState(false)
  const [sealedTag, setSealedTag] = React.useState<string | null>(null)

  // Auctions
  const [auctions, setAuctions] = React.useState<AuctionWithMeta[]>([])
  const [loadingAuctions, setLoadingAuctions] = React.useState(false)
  const [auctionStatus, setAuctionStatus] = React.useState<'active' | 'ended'>('active')

  // Wanted
  const [wanted, setWanted] = React.useState<WantedListingWithUser[]>([])
  const [loadingWanted, setLoadingWanted] = React.useState(false)

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
    try { return JSON.parse(localStorage.getItem('magic-cart') ?? '[]') } catch { return [] }
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('magic-cart', JSON.stringify(cart))
  }, [cart])

  // Fetch cards
  const fetchListings = React.useCallback(async () => {
    setLoadingCards(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (condition) params.set('condition', condition)
      if (color) params.set('color', color)
      if (sellerSearch.trim()) params.set('sellerName', sellerSearch.trim())
      params.set('sort', sort)
      const res = await fetch(`/api/cards?${params}`)
      setListings(await res.json())
    } finally { setLoadingCards(false) }
  }, [search, condition, color, sellerSearch, sort])

  React.useEffect(() => {
    if (tab === 'cards') {
      const t = setTimeout(fetchListings, 300)
      return () => clearTimeout(t)
    }
  }, [fetchListings, tab])

  // Fetch sealed
  const fetchSealed = React.useCallback(async () => {
    setLoadingSealed(true)
    try {
      const params = new URLSearchParams()
      if (sealedTag) params.set('tag', sealedTag)
      params.set('sort', sort)
      const res = await fetch(`/api/sealed?${params}`)
      setSealed(await res.json())
    } finally { setLoadingSealed(false) }
  }, [sealedTag, sort])

  React.useEffect(() => {
    const t = setTimeout(fetchSealed, 300)
    return () => clearTimeout(t)
  }, [fetchSealed])

  // Fetch auctions
  const fetchAuctions = React.useCallback(async () => {
    setLoadingAuctions(true)
    try {
      const res = await fetch(`/api/auctions?status=${auctionStatus}`)
      setAuctions(await res.json())
    } finally { setLoadingAuctions(false) }
  }, [auctionStatus])

  React.useEffect(() => {
    const t = setTimeout(fetchAuctions, 300)
    return () => clearTimeout(t)
  }, [fetchAuctions])

  const fetchWanted = React.useCallback(async () => {
    setLoadingWanted(true)
    try {
      const res = await fetch('/api/wanted')
      setWanted(await res.json())
    } finally { setLoadingWanted(false) }
  }, [])

  React.useEffect(() => {
    const t = setTimeout(fetchWanted, 300)
    return () => clearTimeout(t)
  }, [fetchWanted])

  // Group duplicate card listings
  const grouped: GroupedListing[] = React.useMemo(() => {
    const map = new Map<string, GroupedListing>()
    for (const l of listings) {
      const key = `${l.cardName}||${l.setCode ?? ''}||${l.condition}||${l.isFoil}||${l.user.id}`
      const existing = map.get(key)
      if (existing) {
        existing.quantity += l.quantity
        existing.allIds.push(l.id)
        if (l.price < existing.price) existing.price = l.price
      } else {
        map.set(key, { ...l, allIds: [l.id] })
      }
    }
    return [...map.values()]
  }, [listings])

  const addToCart = (listing: ListingWithUser) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id)
      if (existing) {
        if (existing.quantity >= listing.quantity) { toast.error('No hay más stock disponible'); return prev }
        return prev.map((i) => i.listingId === listing.id ? { ...i, quantity: i.quantity + 1 } : i)
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
        sellerPhone: listing.user.phone ?? null,
        condition: listing.condition,
        isFoil: listing.isFoil,
      }
      toast.success(`${listing.cardName} agregada al carrito`)
      return [...prev, newItem]
    })
  }

  const cartItemIds = new Set(cart.map((i) => i.listingId))
  const hasCardFilters = !!(search || condition || color || sellerSearch)

  const sortLabel = sort === 'price_asc' ? 'Menor precio' : sort === 'price_desc' ? 'Mayor precio' : 'Más recientes'

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/fondo.png)' }} />
      <div className="fixed inset-0 -z-10 bg-black/65" />

      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          <button
            type="button"
            onClick={() => setTab('cards')}
            className={`px-4 py-2.5 text-base font-semibold border-b-2 transition-colors ${
              tab === 'cards' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cartas sueltas
            {!loadingCards && <span className="ml-2 text-xs font-normal text-muted-foreground">({grouped.length})</span>}
          </button>
          <button
            type="button"
            onClick={() => setTab('sealed')}
            className={`px-4 py-2.5 text-base font-semibold border-b-2 transition-colors ${
              tab === 'sealed' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Material sellado
            {!loadingSealed && <span className="ml-2 text-xs font-normal text-muted-foreground">({sealed.length})</span>}
          </button>
          <button
            type="button"
            onClick={() => setTab('auctions')}
            className={`px-4 py-2.5 text-base font-semibold border-b-2 transition-colors ${
              tab === 'auctions' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🔨 Subastas
            {!loadingAuctions && auctions.length > 0 && <span className="ml-2 text-xs font-normal text-yellow-400/70">({auctions.length})</span>}
          </button>

          <button
            type="button"
            onClick={() => setTab('wanted')}
            className={`px-4 py-2.5 text-base font-semibold border-b-2 transition-colors ${
              tab === 'wanted' ? 'border-amber-600 text-amber-500' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🎯 Most Wanted
            {!loadingWanted && wanted.length > 0 && <span className="ml-2 text-xs font-normal text-amber-500/70">({wanted.length})</span>}
          </button>

          {/* Sort — right aligned */}
          <div className="ml-auto flex items-center gap-1 pb-0.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="text-sm bg-transparent border-none outline-none text-muted-foreground cursor-pointer"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* CARDS TAB */}
        {tab === 'cards' && (
          <>
            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); fetchSuggestions(e.target.value) }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
                    placeholder="Buscar carta..."
                    className="pl-9 bg-background/80 backdrop-blur-sm"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-popover rounded-lg shadow-lg overflow-hidden">
                      {suggestions.map((s) => (
                        <button key={s} type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors" onMouseDown={() => { setSearch(s); setShowSuggestions(false) }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative min-w-[160px] max-w-xs">
                  <Input
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Buscar vendedor..."
                    className="bg-background/80 backdrop-blur-sm"
                  />
                  {sellerSearch && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSellerSearch('')}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {CONDITIONS.map((c) => (
                  <Button key={c} size="sm" variant={condition === c ? 'default' : 'outline'} className="bg-background/80 backdrop-blur-sm" onClick={() => setCondition((prev) => (prev === c ? null : c))}>
                    {c}
                  </Button>
                ))}
                <div className="w-px h-6 bg-border mx-1" />
                {COLORS.map((c) => (
                  <button key={c.code} type="button" title={c.label} onClick={() => setColor((prev) => (prev === c.code ? null : c.code))}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all ${c.bg} ${c.text} ${color === c.code ? `${c.border} ring-2 ring-offset-1 ring-offset-background ring-primary scale-110` : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    {c.symbol}
                  </button>
                ))}
                {hasCardFilters && (
                  <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => { setSearch(''); setCondition(null); setColor(null); setSellerSearch('') }}>
                    <X className="h-3.5 w-3.5" /> Limpiar
                  </Button>
                )}
              </div>
            </div>

            {loadingCards ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : grouped.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No hay cartas disponibles</p>
                <p className="text-sm mt-1">{hasCardFilters ? 'Probá con otros filtros' : 'Sé el primero en publicar una carta'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {grouped.map((listing) => (
                  <CardItem key={listing.id} listing={listing} onAddToCart={addToCart} isInCart={cartItemIds.has(listing.id)} isSelf={!!session?.user?.id && listing.user.id === session.user.id} />
                ))}
              </div>
            )}
          </>
        )}

        {/* WANTED TAB */}
        {tab === 'wanted' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">Cartas que la comunidad está buscando</p>
              {session?.user && <AddWantedDialog onCreated={fetchWanted} />}
            </div>

            {loadingWanted ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : wanted.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-lg">Nadie está buscando cartas todavía</p>
                {session?.user
                  ? <p className="text-sm mt-1">¡Sé el primero en publicar una búsqueda!</p>
                  : <p className="text-sm mt-1">Iniciá sesión para publicar una búsqueda</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                {wanted.map(w => <WantedCard key={w.id} listing={w} />)}
              </div>
            )}
          </>
        )}

        {/* AUCTIONS TAB */}
        {tab === 'auctions' && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAuctionStatus('active')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${auctionStatus === 'active' ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-zinc-600 text-zinc-400 hover:text-white'}`}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => setAuctionStatus('ended')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${auctionStatus === 'ended' ? 'bg-zinc-600 border-zinc-600 text-white' : 'border-zinc-600 text-zinc-400 hover:text-white'}`}
              >
                Finalizadas
              </button>
            </div>

            {loadingAuctions ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No hay subastas {auctionStatus === 'active' ? 'activas' : 'finalizadas'}</p>
                <p className="text-sm mt-1">¡Sé el primero en crear una subasta!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {auctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
              </div>
            )}
          </>
        )}

        {/* SEALED TAB */}
        {tab === 'sealed' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {SEALED_TAGS.map((t) => (
                <Button key={t} size="sm" variant={sealedTag === t ? 'default' : 'outline'} className="bg-background/80 backdrop-blur-sm" onClick={() => setSealedTag((prev) => (prev === t ? null : t))}>
                  {t}
                </Button>
              ))}
              {sealedTag && (
                <Button size="sm" variant="ghost" onClick={() => setSealedTag(null)}><X className="h-3.5 w-3.5" /></Button>
              )}
            </div>

            {loadingSealed ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : sealed.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No hay productos sellados disponibles</p>
                <p className="text-sm mt-1">{sealedTag ? 'Probá con otra categoría' : 'Sé el primero en publicar'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sealed.map((listing) => (
                  <SealedItem key={listing.id} listing={listing} isSelf={!!session?.user?.id && listing.user.id === session.user.id} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
