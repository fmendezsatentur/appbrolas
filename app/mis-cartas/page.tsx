'use client'
import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImportDialog, type CardToPublish } from '@/components/ImportDialog'
import { AddCardDialog, type CardFormData } from '@/components/AddCardDialog'
import { Plus, Upload, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'

interface MyListing {
  id: string
  cardName: string
  setName: string | null
  condition: string
  isFoil: boolean
  quantity: number
  price: number
  priceRef: number | null
  imageUrl: string | null
  isActive: boolean
  language: string
  notes: string | null
  createdAt: string
}

export default function MisCartasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [listings, setListings] = React.useState<MyListing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [importOpen, setImportOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)

  React.useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchMyListings = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/cards?seller=${session.user.id}`)
      const data = await res.json()
      setListings(data)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMyListings()
  }, [session?.user?.id])

  const publishCard = async (card: CardFormData) => {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    })
    if (!res.ok) throw new Error('Error publicando carta')
    toast.success(`${card.cardName} publicada`)
    await fetchMyListings()
  }

  const handleImport = async (cards: CardToPublish[]) => {
    setPublishing(true)
    let ok = 0
    let fail = 0
    for (const card of cards) {
      try {
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(card),
        })
        if (res.ok) ok++
        else fail++
      } catch {
        fail++
      }
    }
    setPublishing(false)
    if (ok > 0) toast.success(`${ok} cartas publicadas`)
    if (fail > 0) toast.error(`${fail} cartas no se pudieron publicar`)
    await fetchMyListings()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l))
    )
  }

  const deleteListing = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Carta eliminada')
      setListings((prev) => prev.filter((l) => l.id !== id))
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const active = listings.filter((l) => l.isActive)
  const inactive = listings.filter((l) => !l.isActive)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis cartas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {active.length} activas · {inactive.length} inactivas
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setImportOpen(true)}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar Moxfield
            </Button>
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Agregar carta
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">No tenés cartas publicadas.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" /> Importar de Moxfield
              </Button>
              <Button onClick={() => setAddOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Agregar manualmente
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                  listing.isActive ? 'border-border bg-card' : 'border-border/50 bg-card/50 opacity-60'
                }`}
              >
                {listing.imageUrl && (
                  <img
                    src={listing.imageUrl}
                    alt={listing.cardName}
                    className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{listing.cardName}</span>
                    {listing.isFoil && (
                      <Badge variant="secondary" className="text-xs">Foil</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{listing.setName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {listing.condition} · x{listing.quantity} · {listing.language.toUpperCase()}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold">${listing.price.toFixed(2)}</div>
                  {listing.priceRef && (
                    <div className="text-xs text-muted-foreground">Ref: ${listing.priceRef.toFixed(2)}</div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleActive(listing.id, listing.isActive)}
                    title={listing.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {listing.isActive ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteListing(listing.id, listing.cardName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <AddCardDialog open={addOpen} onOpenChange={setAddOpen} onSave={publishCard} />
    </div>
  )
}
