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

  return (
    <Link href={`/subastas/${auction.id}`} className="block group">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-yellow-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10 h-full flex flex-col">
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
