'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

export interface ListingWithUser {
  id: string
  cardName: string
  setName: string | null
  condition: string
  isFoil: boolean
  quantity: number
  price: number
  priceRef: number | null
  imageUrl: string | null
  language: string
  notes: string | null
  user: {
    id: string
    name: string | null
    image: string | null
    phone: string | null
  }
}

const CONDITIONS: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}

const CONDITION_COLORS: Record<string, string> = {
  NM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LP: 'bg-green-500/10 text-green-400 border-green-500/20',
  MP: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  HP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DMG: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface CardItemProps {
  listing: ListingWithUser
  onAddToCart: (listing: ListingWithUser) => void
  isInCart: boolean
}

export function CardItem({ listing, onAddToCart, isInCart }: CardItemProps) {
  const discount =
    listing.priceRef && listing.price < listing.priceRef
      ? Math.round(((listing.priceRef - listing.price) / listing.priceRef) * 100)
      : null

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.cardName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}

        {listing.isFoil && (
          <div className="absolute top-2 left-2">
            <Badge className="text-xs bg-purple-500/90 text-white border-0">Foil ✨</Badge>
          </div>
        )}

        {discount && (
          <div className="absolute top-2 right-2">
            <Badge className="text-xs bg-green-500/90 text-white border-0">-{discount}%</Badge>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{listing.cardName}</h3>
          {listing.setName && (
            <p className="text-xs text-muted-foreground mt-0.5">{listing.setName}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CONDITION_COLORS[listing.condition] ?? 'bg-muted'}`}
          >
            {listing.condition}
          </span>
          {listing.language !== 'en' && (
            <span className="text-xs px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground uppercase">
              {listing.language}
            </span>
          )}
        </div>

        <div className="mt-auto space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg">
              ${listing.price.toFixed(2)}
            </span>
            {listing.priceRef && (
              <span className="text-xs text-muted-foreground line-through">
                ${listing.priceRef.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Stock: {listing.quantity} · {listing.user.name?.split(' ')[0]}
            </span>
          </div>

          <Button
            size="sm"
            className="w-full gap-2 mt-1"
            variant={isInCart ? 'secondary' : 'default'}
            onClick={() => onAddToCart(listing)}
            disabled={listing.quantity === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isInCart ? 'En carrito' : 'Agregar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
