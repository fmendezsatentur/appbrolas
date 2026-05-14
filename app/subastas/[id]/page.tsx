'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Countdown from '@/components/Countdown'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMOJIS = ['🔥', '👏', '🎉', '💰', '😮', '👑', '🤑', '🚀', '😂', '❤️']

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: { id: string; name: string | null }
}

interface Bid {
  id: string
  amount: number
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
  reactions: Reaction[]
}

interface Auction {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  startingPrice: number
  currentPrice: number
  minIncrement: number
  endTime: string
  status: string
  userId: string
  user: { id: string; name: string | null; image: string | null; phone: string | null }
  winner: { id: string; name: string | null; phone: string | null } | null
  bids: Bid[]
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState('')

  const fetchAuction = useCallback(async () => {
    const res = await fetch(`/api/auctions/${id}`)
    if (res.ok) setAuction(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchAuction()
    const iv = setInterval(fetchAuction, 15000)
    return () => clearInterval(iv)
  }, [fetchAuction])

  if (loading) {
    return (
      <>
        <Navbar cartCount={0} />
        <main className="min-h-screen flex items-center justify-center text-zinc-400">Cargando...</main>
      </>
    )
  }

  if (!auction) {
    return (
      <>
        <Navbar cartCount={0} />
        <main className="min-h-screen flex items-center justify-center text-zinc-400">Subasta no encontrada</main>
      </>
    )
  }

  const isOwner = session?.user?.id === auction.userId
  const topBid = auction.bids[0]
  const isTopBidder = topBid?.user?.id === session?.user?.id
  const isEnded = auction.status === 'ended'
  const isWinner = isEnded && auction.winner?.id === session?.user?.id
  const minBid = auction.currentPrice + auction.minIncrement

  function handleBidClick() {
    setBidError('')
    setBidSuccess('')
    const amt = parseFloat(bidAmount || String(minBid))
    if (isNaN(amt) || amt < minBid) {
      setBidError(`La oferta mínima es $${minBid.toLocaleString('es-AR')}`)
      return
    }
    setConfirming(true)
  }

  async function confirmBid() {
    const amt = parseFloat(bidAmount || String(minBid))
    setBidLoading(true)
    setBidError('')
    try {
      const res = await fetch(`/api/auctions/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBidError(data.error ?? 'Error al pujar')
      } else {
        setBidSuccess(`¡Oferta de $${amt.toLocaleString('es-AR')} registrada!`)
        setBidAmount('')
        fetchAuction()
      }
    } finally {
      setBidLoading(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <Navbar cartCount={0} />
      <main className="min-h-screen bg-zinc-950 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/?tab=subastas" className="text-zinc-400 hover:text-white text-sm mb-6 inline-block">
            ← Volver a subastas
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image + info */}
            <div>
              <div className="relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 max-w-xs mx-auto">
                {auction.imageUrl ? (
                  <Image src={auction.imageUrl} alt={auction.title} fill className="object-contain p-4" sizes="350px" />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">🔨</div>
                )}
              </div>

              <div className="mt-4 text-center text-sm text-zinc-400">
                Publicado por <span className="text-white font-medium">{auction.user.name}</span>
              </div>
            </div>

            {/* Details + bid */}
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-white">{auction.title}</h1>
                {auction.description && (
                  <p className="text-zinc-400 mt-1 text-sm">{auction.description}</p>
                )}
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Precio actual</span>
                  <div className="text-right">
                    <span className="text-yellow-400 font-bold text-2xl">
                      ${auction.currentPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="ml-1.5 text-xs text-zinc-500 font-normal">ARS</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Incremento mínimo</span>
                  <span className="text-zinc-200">${auction.minIncrement.toLocaleString('es-AR')} <span className="text-xs text-zinc-500">ARS</span></span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {isEnded ? 'Finalizó' : 'Cierra en'}
                  </span>
                  <span>
                    {isEnded
                      ? new Date(auction.endTime).toLocaleString('es-AR')
                      : <Countdown endTime={auction.endTime} onExpire={fetchAuction} />
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Ofertas</span>
                  <span className="text-zinc-200">{auction.bids.length}</span>
                </div>
              </div>

              {/* Winner contact */}
              {isEnded && auction.winner && (
                <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
                  <p className="text-green-400 font-semibold">
                    {isWinner ? '🏆 ¡Ganaste esta subasta!' : `Ganador: ${auction.winner.name}`}
                  </p>
                  {(isWinner || isOwner) && auction.winner.phone && (
                    <a
                      href={`https://wa.me/${auction.winner.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Te contacto por la subasta "${auction.title}"`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Contactar por WhatsApp
                    </a>
                  )}
                  {isOwner && !isWinner && auction.user.phone && (
                    <a
                      href={`https://wa.me/${auction.winner.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${auction.winner.name}! Ganaste la subasta "${auction.title}" con $${auction.currentPrice.toLocaleString('es-AR')}. ¿Coordinamos?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Contactar al ganador
                    </a>
                  )}
                </div>
              )}

              {/* Bid form */}
              {!isEnded && !isOwner && session?.user && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                  <p className="text-sm text-zinc-400 font-medium">Hacer una oferta</p>

                  {isTopBidder && (
                    <p className="text-yellow-400 text-sm font-medium">✓ Tu oferta es la más alta</p>
                  )}

                  {!isTopBidder && !confirming && (
                    <>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={minBid}
                          step={auction.minIncrement}
                          placeholder={`Mínimo $${minBid.toLocaleString('es-AR')} ARS`}
                          value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                          className="bg-zinc-800 border-zinc-600 text-white"
                        />
                        <Button onClick={handleBidClick}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold shrink-0">
                          Ofertar
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => { setBidAmount(String(minBid)); handleBidClick() }}
                      >
                        Ofertar mínimo (${minBid.toLocaleString('es-AR')} ARS)
                      </Button>
                    </>
                  )}

                  {confirming && (
                    <div className="space-y-3">
                      <p className="text-white text-sm">
                        ¿Confirmás tu oferta de{' '}
                        <span className="font-bold text-yellow-400">
                          ${parseFloat(bidAmount || String(minBid)).toLocaleString('es-AR')}
                        </span>?
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={confirmBid} disabled={bidLoading}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">
                          {bidLoading ? 'Enviando...' : 'Confirmar'}
                        </Button>
                        <Button variant="outline" onClick={() => setConfirming(false)}
                          className="flex-1 border-zinc-600 text-zinc-300">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {bidError && <p className="text-red-400 text-sm">{bidError}</p>}
                  {bidSuccess && <p className="text-green-400 text-sm">{bidSuccess}</p>}
                </div>
              )}

              {!session?.user && !isEnded && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center">
                  <Link href="/login" className="text-yellow-400 hover:underline text-sm">
                    Iniciá sesión para ofertar
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bid history */}
          {auction.bids.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Historial de ofertas</h2>
              <div className="space-y-3">
                {auction.bids.map((bid, i) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    isTop={i === 0}
                    sessionUserId={session?.user?.id ?? null}
                    onReact={async (emoji) => {
                      const myReaction = bid.reactions.find(r => r.userId === session?.user?.id)
                      if (myReaction?.emoji === emoji) {
                        await fetch(`/api/auctions/bids/${bid.id}/reaction`, { method: 'DELETE' })
                      } else {
                        await fetch(`/api/auctions/bids/${bid.id}/reaction`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ emoji }),
                        })
                      }
                      fetchAuction()
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

// ─── BidRow ─────────────────────────────────────────────────────────────────

function BidRow({
  bid,
  isTop,
  sessionUserId,
  onReact,
}: {
  bid: Bid
  isTop: boolean
  sessionUserId: string | null
  onReact: (emoji: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  const myReaction = bid.reactions.find(r => r.userId === sessionUserId)

  // Group reactions: emoji → list of names
  const grouped = bid.reactions.reduce<Record<string, string[]>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = []
    acc[r.emoji].push(r.user.name ?? 'Anónimo')
    return acc
  }, {})

  const totalReactions = bid.reactions.length
  const canReact = !!sessionUserId

  return (
    <div className={`rounded-lg border ${isTop ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
      {/* Main bid row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {bid.user.image && (
            <Image src={bid.user.image} alt="" width={28} height={28} className="rounded-full" />
          )}
          <div>
            <p className="text-sm font-medium text-white">
              {bid.user.name}
              {isTop && <span className="ml-2 text-yellow-400 text-xs">Oferta más alta</span>}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(bid.createdAt).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
        <span className={`font-bold ${isTop ? 'text-yellow-400' : 'text-zinc-300'}`}>
          ${bid.amount.toLocaleString('es-AR')}
        </span>
      </div>

      {/* Reactions bar */}
      <div className="px-3 pb-2 flex items-center gap-1 flex-wrap">
        {/* Existing grouped reactions */}
        {Object.entries(grouped).map(([emoji, names]) => (
          <div key={emoji} className="relative">
            <button
              type="button"
              onClick={() => canReact && onReact(emoji)}
              onMouseEnter={() => setHoveredEmoji(emoji)}
              onMouseLeave={() => setHoveredEmoji(null)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition
                ${myReaction?.emoji === emoji
                  ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
            >
              {emoji} <span className="text-xs">{names.length}</span>
            </button>
            {/* Tooltip con nombres */}
            {hoveredEmoji === emoji && (
              <div className="absolute bottom-full left-0 mb-1 z-50 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1.5 text-xs text-zinc-200 whitespace-nowrap shadow-lg pointer-events-none">
                {names.join(', ')}
              </div>
            )}
          </div>
        ))}

        {/* Add reaction button */}
        {canReact && totalReactions < 10 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(p => !p)}
              className="px-2 py-0.5 rounded-full text-sm border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition"
            >
              {myReaction ? '✏️' : '＋'}
            </button>
            {showPicker && (
              <div className="absolute bottom-full left-0 mb-1 z-50 bg-zinc-800 border border-zinc-600 rounded-xl p-2 flex flex-wrap gap-1 shadow-xl max-w-[200px]">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onReact(e); setShowPicker(false) }}
                    className={`text-lg hover:scale-125 transition-transform p-0.5 rounded ${myReaction?.emoji === e ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
