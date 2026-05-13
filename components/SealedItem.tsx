'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Package } from 'lucide-react'

export interface SealedListingWithUser {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  price: number
  tag: string
  isActive: boolean
  user: {
    id: string
    name: string | null
    image: string | null
    phone: string | null
  }
}

const TAG_COLORS: Record<string, string> = {
  SOBRES:           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'MAZO COMMANDER': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'MAZO PAUPER':    'bg-green-500/20 text-green-300 border-green-500/30',
  BUNDLE:           'bg-orange-500/20 text-orange-300 border-orange-500/30',
  PRECON:           'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  OTROS:            'bg-muted text-muted-foreground border-border',
}

interface SealedItemProps {
  listing: SealedListingWithUser
  isSelf?: boolean
}

export function SealedItem({ listing, isSelf }: SealedItemProps) {
  const contactSeller = () => {
    if (!listing.user.phone) return
    const msg = encodeURIComponent(
      `Hola ${listing.user.name?.split(' ')[0] ?? ''}! Vi tu publicación en Magic Market: "${listing.title}" a $${listing.price.toFixed(2)}. ¿Está disponible?`
    )
    window.open(`https://wa.me/${listing.user.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 opacity-30" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TAG_COLORS[listing.tag] ?? TAG_COLORS.OTROS}`}>
            {listing.tag}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{listing.title}</h3>

        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{listing.description}</p>
        )}

        <div className="mt-auto space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-lg">${listing.price.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">{listing.user.name?.split(' ')[0]}</span>
          </div>

          <Button
            size="sm"
            className="w-full gap-2"
            variant={isSelf ? 'outline' : 'default'}
            disabled={isSelf || !listing.user.phone}
            onClick={contactSeller}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {isSelf ? 'Tu publicación' : 'Contactar vendedor'}
          </Button>
        </div>
      </div>
    </div>
  )
}
