'use client'

import Link from 'next/link'
import Image from 'next/image'
import Countdown from './Countdown'

export interface AuctionWithMeta {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  startingPrice: number
  currentPrice: number
  minIncrement: number
  endTime: string
  status: string
  user: { id: string; name: string | null; image: string | null }
  winner: { id: string; name: string | null } | null
  _count: { bids: number }
}

export default function AuctionCard({ auction }: { auction: AuctionWithMeta }) {
  const ended = auction.status === 'ended'
  const msLeft = new Date(auction.endTime).getTime() - Date.now()
  const isUrgent = !ended && msLeft < 60 * 60 * 1000 // menos de 1 hora

  return (
    <Link href={`/subastas/${auction.id}`} className="block group">
      <div className={`relative rounded-xl overflow-hidden transition-all duration-200 h-full flex flex-col
        ${ended
          ? 'bg-zinc-900/60 border border-zinc-800 opacity-70'
          : isUrgent
            ? 'bg-zinc-900 border-2 border-red-500/70 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:border-red-400'
            : 'bg-zinc-900 border-2 border-yellow-500/40 shadow-md shadow-yellow-500/10 hover:border-yellow-400 hover:shadow-yellow-500/30'
        }`}>

        {/* Urgency ribbon */}
        {isUrgent && !ended && (
          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
            ¡Termina pronto!
          </div>
        )}

        <div className="relative aspect-[4/3] bg-zinc-800">
          {auction.imageUrl ? (
            <Image
              src={auction.imageUrl}
              alt={auction.title}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl text-zinc-600">🔨</div>
          )}
          {ended && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Finalizada</span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="font-semibold text-sm text-white line-clamp-2 leading-tight">{auction.title}</p>

          <div className="mt-auto pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{auction._count.bids} {auction._count.bids === 1 ? 'oferta' : 'ofertas'}</span>
              {!ended && <Countdown endTime={auction.endTime} />}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Precio actual</p>
                <p className="text-yellow-400 font-bold text-base">${auction.currentPrice.toLocaleString('es-AR')}</p>
              </div>
              {ended && auction.winner && (
                <span className="text-xs text-green-400 font-medium">
                  Ganó: {auction.winner.name}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 truncate">por {auction.user.name}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
