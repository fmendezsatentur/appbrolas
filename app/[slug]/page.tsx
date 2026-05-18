'use client'
import * as React from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Loader2, Package, CreditCard, Gavel } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CardListing {
  id: string; cardName: string; setName: string | null; condition: string
  isFoil: boolean; quantity: number; price: number; imageUrl: string | null
  language: string; notes: string | null
}
interface SealedListing {
  id: string; title: string; description: string | null; price: number
  imageUrl: string | null; tag: string
}
interface Auction {
  id: string; title: string; imageUrl: string | null; currentPrice: number
  endTime: string; _count: { bids: number }
}
interface ProfileData {
  user: { id: string; name: string | null; image: string | null; phone: string | null }
  cards: CardListing[]
  sealed: SealedListing[]
  auctions: Auction[]
}

const CONDITION_COLORS: Record<string, string> = {
  NM: 'text-emerald-400', LP: 'text-green-400', MP: 'text-yellow-400',
  HP: 'text-orange-400', DMG: 'text-red-400',
}

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = React.useState<ProfileData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [tab, setTab] = React.useState<'cards' | 'sealed' | 'auctions'>('cards')

  React.useEffect(() => {
    if (!slug) return
    fetch(`/api/u/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  if (notFound || !data) return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-5xl">🃏</p>
        <p className="text-lg font-semibold">Usuario no encontrado</p>
        <Link href="/" className="text-sm underline">Volver al marketplace</Link>
      </div>
    </div>
  )

  const { user, cards, sealed, auctions } = data

  const waMsg = encodeURIComponent(`Hola ${user.name}! Vi tu carpeta en Magic Market 🃏`)
  const waUrl = user.phone ? `https://wa.me/${user.phone.replace(/\D/g, '')}?text=${waMsg}` : null

  const tabs = [
    { key: 'cards',   label: `Cartas (${cards.length})`,   icon: <CreditCard className="h-4 w-4" /> },
    { key: 'sealed',  label: `Sellado (${sealed.length})`,  icon: <Package className="h-4 w-4" /> },
    { key: 'auctions',label: `Subastas (${auctions.length})`,icon: <Gavel className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Header del perfil */}
        <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl border border-border bg-card">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ''} width={72} height={72} className="rounded-full flex-shrink-0" />
          ) : (
            <div className="w-18 h-18 rounded-full bg-muted flex items-center justify-center text-3xl flex-shrink-0">🧙</div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cards.length} cartas · {sealed.length} sellado · {auctions.length} subastas activas
            </p>
          </div>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* CARTAS */}
        {tab === 'cards' && (
          cards.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No tiene cartas publicadas</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map(c => (
                <div key={c.id} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                  <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.cardName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
                        {c.cardName}
                      </div>
                    )}
                    {c.isFoil && (
                      <span className="absolute top-1.5 left-1.5 text-xs bg-purple-500/90 text-white px-1.5 py-0.5 rounded font-medium">Foil ✨</span>
                    )}
                  </div>
                  <div className="p-2.5 flex flex-col gap-1 flex-1">
                    <p className="font-semibold text-xs leading-tight line-clamp-2">{c.cardName}</p>
                    {c.setName && <p className="text-[11px] text-muted-foreground">{c.setName}</p>}
                    {c.notes && <p className="text-[11px] text-muted-foreground/70 italic line-clamp-1">{c.notes}</p>}
                    <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
                      <span className={`text-[11px] font-medium ${CONDITION_COLORS[c.condition] ?? ''}`}>{c.condition}</span>
                      {c.language !== 'en' && <span className="text-[11px] text-muted-foreground uppercase">{c.language}</span>}
                      <span className="ml-auto font-bold text-sm">${c.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Stock: x{c.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SELLADO */}
        {tab === 'sealed' && (
          sealed.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No tiene productos sellados</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sealed.map(s => (
                <div key={s.id} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[11px] bg-black/60 text-white px-1.5 py-0.5 rounded">{s.tag}</span>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="font-semibold text-xs leading-tight line-clamp-2">{s.title}</p>
                    {s.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>}
                    <p className="font-bold text-sm">${s.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SUBASTAS */}
        {tab === 'auctions' && (
          auctions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No tiene subastas activas</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {auctions.map(a => (
                <Link key={a.id} href={`/subastas/${a.id}`} className="flex gap-3 p-3 rounded-xl border border-yellow-500/30 bg-card hover:border-yellow-500/60 transition-colors">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.title} className="w-14 h-20 object-contain rounded flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-20 rounded bg-muted flex items-center justify-center text-xl flex-shrink-0">🔨</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a._count.bids} ofertas</p>
                    <p className="font-bold text-yellow-400 mt-1">${a.currentPrice.toLocaleString('es-AR')}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cierra: {new Date(a.endTime).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

      </main>
    </div>
  )
}
