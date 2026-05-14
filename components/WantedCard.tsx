'use client'

import Image from 'next/image'

export interface WantedListingWithUser {
  id: string
  cardName: string
  quantity: number
  notes: string | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  user: { id: string; name: string | null; image: string | null; phone: string | null }
}

export default function WantedCard({ listing }: { listing: WantedListingWithUser }) {
  const waMsg = encodeURIComponent(
    `Hola ${listing.user.name}! Vi que buscás ${listing.quantity}x ${listing.cardName} en Magic Market. ¡Tengo! 🃏`
  )
  const waUrl = listing.user.phone
    ? `https://wa.me/${listing.user.phone.replace(/\D/g, '')}?text=${waMsg}`
    : null

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Poster */}
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        {/* Poster background */}
        <Image
          src="/wanted-poster.png"
          alt="wanted poster"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* Card image inside the cream frame area */}
        <div
          className="absolute overflow-hidden"
          style={{ top: '20%', left: '10%', width: '80%', height: '68%' }}
        >
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.cardName}
              fill
              className="object-contain"
              sizes="200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-900/40 text-xs font-bold text-center px-2 leading-tight">
              {listing.cardName}
            </div>
          )}
        </div>
      </div>

      {/* Info below poster */}
      <div className="w-full text-center space-y-1 px-1">
        <p className="font-bold text-sm text-white leading-tight line-clamp-2">{listing.cardName}</p>
        <p className="text-xs text-amber-400 font-semibold">Busco x{listing.quantity}</p>
        <p className="text-xs text-zinc-400">por <span className="text-zinc-200">{listing.user.name}</span></p>
        {listing.notes && (
          <p className="text-xs text-zinc-500 line-clamp-1 italic">{listing.notes}</p>
        )}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Tengo esta carta
          </a>
        ) : (
          <p className="text-xs text-zinc-600 mt-1">Sin WhatsApp</p>
        )}
      </div>
    </div>
  )
}
