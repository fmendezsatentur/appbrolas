'use client'
import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ImportDialog, type CardToPublish } from '@/components/ImportDialog'
import { AddCardDialog, type CardFormData } from '@/components/AddCardDialog'
import { AddSealedDialog, type SealedFormData } from '@/components/AddSealedDialog'
import { type SealedListingWithUser } from '@/components/SealedItem'
import AddAuctionDialog from '@/components/AddAuctionDialog'
import { type AuctionWithMeta } from '@/components/AuctionCard'
import Link from 'next/link'
import {
  Plus, Upload, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, Check, X, ImageOff, ChevronDown, Square, CheckSquare, AlertTriangle, Package,
  ShoppingBag, TrendingUp, Clock, CheckCircle2, XCircle, Gavel,
} from 'lucide-react'

interface Order {
  id: string
  listingId: string
  cardName: string
  setName: string | null
  imageUrl: string | null
  quantity: number
  price: number
  condition: string
  isFoil: boolean
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
  buyer: { id: string; name: string | null; image: string | null; phone: string | null }
  seller: { id: string; name: string | null; image: string | null; phone: string | null }
}

interface MyListing {
  id: string
  cardName: string
  setName: string | null
  setCode: string | null
  collectorNumber: string | null
  condition: string
  isFoil: boolean
  quantity: number
  price: number
  priceRef: number | null
  imageUrl: string | null
  scryfallId: string | null
  isActive: boolean
  language: string
  notes: string | null
  createdAt: string
}

interface PrintInfo {
  id: string
  name: string
  set: string
  set_name: string
  collector_number: string
  imageUrl: string | null
  prices: { usd: string | null; usd_foil: string | null }
  released_at: string
}

interface EditDraft {
  price: string
  quantity: string
  condition: string
}

export default function MisCartasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [listings, setListings] = React.useState<MyListing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [importOpen, setImportOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [hasPhone, setHasPhone] = React.useState<boolean | null>(null)

  // Sealed state
  const [sealedListings, setSealedListings] = React.useState<SealedListingWithUser[]>([])
  const [addSealedOpen, setAddSealedOpen] = React.useState(false)

  // Orders state
  const [pageTab, setPageTab] = React.useState<'cards' | 'sealed' | 'auctions' | 'sales' | 'purchases'>('cards')
  const [sales, setSales] = React.useState<Order[]>([])
  const [purchases, setPurchases] = React.useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = React.useState(false)

  // My auctions
  const [myAuctions, setMyAuctions] = React.useState<AuctionWithMeta[]>([])
  const [loadingAuctions, setLoadingAuctions] = React.useState(false)

  // Inline edit state
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState<EditDraft>({ price: '', quantity: '', condition: '' })
  const [saving, setSaving] = React.useState(false)

  // Edition picker state
  const [printPickerId, setPrintPickerId] = React.useState<string | null>(null)
  const [prints, setPrints] = React.useState<PrintInfo[]>([])
  const [loadingPrints, setLoadingPrints] = React.useState(false)

  // Multi-select state
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = React.useState(false)

  React.useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchMyListings = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const [listingsRes, profileRes, sealedRes] = await Promise.all([
        fetch(`/api/cards?seller=${session.user.id}`),
        fetch('/api/profile'),
        fetch(`/api/sealed?seller=${session.user.id}`),
      ])
      const data = await listingsRes.json()
      setListings(data)
      if (profileRes.ok) {
        const profile = await profileRes.json()
        setHasPhone(!!(profile.phone))
      }
      if (sealedRes.ok) setSealedListings(await sealedRes.json())
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
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Error publicando carta')
    }
    toast.success(`${card.cardName} publicada`)
    await fetchMyListings()
  }

  const publishSealed = async (data: SealedFormData) => {
    const res = await fetch('/api/sealed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Error publicando')
    }
    toast.success('Producto publicado')
    await fetchMyListings()
  }

  const deleteSealed = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    const res = await fetch(`/api/sealed/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Eliminado')
      setSealedListings((prev) => prev.filter((l) => l.id !== id))
    }
  }

  const toggleSealedActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/sealed/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setSealedListings((prev) => prev.map((l) => l.id === id ? { ...l, isActive: !isActive } : l))
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const [salesRes, purchasesRes] = await Promise.all([
        fetch('/api/orders?role=seller'),
        fetch('/api/orders?role=buyer'),
      ])
      if (salesRes.ok) setSales(await salesRes.json())
      if (purchasesRes.ok) setPurchases(await purchasesRes.json())
    } finally {
      setLoadingOrders(false)
    }
  }

  React.useEffect(() => {
    if ((pageTab === 'sales' || pageTab === 'purchases') && sales.length === 0 && purchases.length === 0) {
      fetchOrders()
    }
    if (pageTab === 'auctions') {
      fetchMyAuctions()
    }
  }, [pageTab])

  const fetchMyAuctions = async () => {
    if (!session?.user?.id) return
    setLoadingAuctions(true)
    try {
      const res = await fetch(`/api/auctions?seller=${session.user.id}`)
      if (res.ok) setMyAuctions(await res.json())
    } finally {
      setLoadingAuctions(false)
    }
  }

  const deleteAuction = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar la subasta "${title}"?`)) return
    const res = await fetch(`/api/auctions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Subasta eliminada')
      setMyAuctions((prev) => prev.filter((a) => a.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'No se pudo eliminar')
    }
  }

  const updateOrderStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Error al actualizar'); return }
    setSales((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    if (status === 'cancelled') {
      toast.success('Venta cancelada — carta reactivada')
      await fetchMyListings()
    } else {
      toast.success('Venta confirmada')
    }
  }

  const handleImport = async (cards: CardToPublish[]) => {
    setPublishing(true)
    let ok = 0, fail = 0
    for (const card of cards) {
      try {
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(card),
        })
        if (res.ok) ok++; else fail++
      } catch { fail++ }
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
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l)))
  }

  const deleteListing = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Carta eliminada')
      setListings((prev) => prev.filter((l) => l.id !== id))
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  // --- Inline edit ---
  const startEdit = (listing: MyListing) => {
    setEditingId(listing.id)
    setEditDraft({
      price: listing.price.toString(),
      quantity: listing.quantity.toString(),
      condition: listing.condition,
    })
    setPrintPickerId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setPrintPickerId(null)
    setPrints([])
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cards/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(editDraft.price),
          quantity: parseInt(editDraft.quantity),
          condition: editDraft.condition,
        }),
      })
      if (!res.ok) throw new Error()
      setListings((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, price: parseFloat(editDraft.price), quantity: parseInt(editDraft.quantity), condition: editDraft.condition }
            : l
        )
      )
      toast.success('Guardado')
      setEditingId(null)
      setPrintPickerId(null)
      setPrints([])
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // --- Edition picker ---
  const openPrintPicker = async (listing: MyListing) => {
    if (printPickerId === listing.id) { setPrintPickerId(null); setPrints([]); return }
    setPrintPickerId(listing.id)
    setLoadingPrints(true)
    setPrints([])
    try {
      const res = await fetch(`/api/scryfall/prints?name=${encodeURIComponent(listing.cardName)}`)
      const data = await res.json()
      setPrints(data.data ?? [])
    } catch {
      toast.error('No se pudieron cargar las ediciones')
    } finally {
      setLoadingPrints(false)
    }
  }

  const selectPrint = async (listingId: string, print: PrintInfo, isFoil: boolean) => {
    const priceStr = isFoil ? print.prices.usd_foil : print.prices.usd
    const priceRef = priceStr ? parseFloat(priceStr) : null

    const res = await fetch(`/api/cards/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setName: print.set_name,
        setCode: print.set,
        collectorNumber: print.collector_number,
        imageUrl: print.imageUrl,
        scryfallId: print.id,
        ...(priceRef !== null && { price: priceRef, priceRef }),
      }),
    })
    if (!res.ok) { toast.error('Error al actualizar edición'); return }

    setListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? {
              ...l,
              setName: print.set_name,
              setCode: print.set,
              collectorNumber: print.collector_number,
              imageUrl: print.imageUrl,
              scryfallId: print.id,
              ...(priceRef !== null && { price: priceRef, priceRef }),
            }
          : l
      )
    )
    if (editDraft && editingId === listingId && priceRef !== null) {
      setEditDraft((d) => ({ ...d, price: priceRef.toString() }))
    }
    toast.success(`Edición actualizada: ${print.set_name}`)
    setPrintPickerId(null)
    setPrints([])
  }

  // --- Multi-select ---
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === listings.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(listings.map((l) => l.id)))
    }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`¿Eliminar ${selected.size} cartas?`)) return
    setBulkDeleting(true)
    const ids = [...selected]
    let ok = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
        if (res.ok) ok++
      } catch {}
    }
    setBulkDeleting(false)
    if (ok > 0) {
      toast.success(`${ok} cartas eliminadas`)
      setListings((prev) => prev.filter((l) => !selected.has(l.id)))
      setSelected(new Set())
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
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis cartas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {active.length} activas · {inactive.length} inactivas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageTab === 'cards' && (<>
              <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)} disabled={publishing}>
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar Moxfield
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Agregar carta
              </Button>
            </>)}
            {pageTab === 'sealed' && (
              <Button className="gap-2" onClick={() => setAddSealedOpen(true)}>
                <Plus className="h-4 w-4" />
                Publicar sellado
              </Button>
            )}
            {pageTab === 'auctions' && (
              <AddAuctionDialog onCreated={fetchMyAuctions} />
            )}
          </div>
        </div>

        {/* Page tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
          {[
            { key: 'cards',     label: 'Mis cartas', icon: <Package className="h-4 w-4" /> },
            { key: 'sealed',    label: `Sellado${sealedListings.length ? ` (${sealedListings.length})` : ''}`, icon: <Package className="h-4 w-4" /> },
            { key: 'auctions',  label: `Subastas${myAuctions.length ? ` (${myAuctions.length})` : ''}`, icon: <Gavel className="h-4 w-4" /> },
            { key: 'sales',     label: `Ventas${sales.length ? ` (${sales.length})` : ''}`, icon: <TrendingUp className="h-4 w-4" /> },
            { key: 'purchases', label: `Compras${purchases.length ? ` (${purchases.length})` : ''}`, icon: <ShoppingBag className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPageTab(key as 'cards' | 'sealed' | 'auctions' | 'sales' | 'purchases')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                pageTab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* SALES TAB */}
        {pageTab === 'sales' && (
          <OrderList
            orders={sales}
            role="seller"
            loading={loadingOrders}
            onUpdateStatus={updateOrderStatus}
          />
        )}

        {/* PURCHASES TAB */}
        {pageTab === 'purchases' && (
          <OrderList orders={purchases} role="buyer" loading={loadingOrders} />
        )}

        {/* SEALED TAB */}
        {pageTab === 'sealed' && (
          sealedListings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tenés productos sellados publicados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sealedListings.map((listing) => (
                <div key={listing.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${listing.isActive ? 'border-border bg-card' : 'border-border/50 bg-card/50 opacity-60'}`}>
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{listing.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground flex-shrink-0">{listing.tag}</span>
                    </div>
                    {listing.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{listing.description}</p>
                    )}
                  </div>
                  <div className="font-bold flex-shrink-0">${listing.price.toFixed(2)}</div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSealedActive(listing.id, listing.isActive)} title={listing.isActive ? 'Pausar' : 'Activar'}>
                      {listing.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteSealed(listing.id, listing.title)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* AUCTIONS TAB */}
        {pageTab === 'auctions' && (
          loadingAuctions ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : myAuctions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
              <Gavel className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tenés subastas creadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myAuctions.map((auction) => {
                const ended = auction.status === 'ended'
                const canDelete = !ended && auction._count.bids === 0
                return (
                  <div key={auction.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ended ? 'border-border/50 bg-card/50 opacity-70' : 'border-border bg-card'}`}>
                    {auction.imageUrl ? (
                      <img src={auction.imageUrl} alt={auction.title} className="w-10 h-14 object-contain rounded flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-muted flex items-center justify-center text-xl flex-shrink-0">🔨</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/subastas/${auction.id}`} className="font-semibold text-sm hover:underline truncate">{auction.title}</Link>
                        {ended ? (
                          <span className="text-xs px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">Finalizada</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400">Activa</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {auction._count.bids} {auction._count.bids === 1 ? 'oferta' : 'ofertas'} · Precio actual: ${auction.currentPrice.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ended ? 'Cerró' : 'Cierra'}: {new Date(auction.endTime).toLocaleString('es-AR')}
                      </p>
                    </div>
                    {ended && auction.winner && (
                      <div className="text-xs text-green-400 font-medium flex-shrink-0">
                        Ganador: {auction.winner.name}
                      </div>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => deleteAuction(auction.id, auction.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {pageTab === 'cards' && (<>

        {/* WhatsApp warning */}
        {hasPhone === false && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-sm">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-yellow-400">Necesitás agregar tu número de WhatsApp antes de publicar cartas.</span>
              {' '}Hacé click en tu nombre en la barra superior para abrirlo.
            </div>
          </div>
        )}

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <span className="text-sm font-medium">{selected.size} seleccionadas</span>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2 ml-auto"
              onClick={bulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Eliminar seleccionadas
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

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
          <>
            {/* Select-all row */}
            <div className="flex items-center gap-2 px-3 pb-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                {selected.size === listings.length && listings.length > 0
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4" />}
                Seleccionar todas
              </button>
            </div>

            <div className="space-y-2">
              {listings.map((listing) => {
                const isEditing = editingId === listing.id
                const isSelected = selected.has(listing.id)
                const showPrints = printPickerId === listing.id

                return (
                  <div key={listing.id} className="rounded-xl border border-border overflow-hidden">
                    {/* Main row */}
                    <div
                      className={`flex items-center gap-3 p-3 transition-colors ${
                        listing.isActive ? 'bg-card' : 'bg-card/50 opacity-60'
                      } ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(listing.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />}
                      </button>

                      {/* Image */}
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.cardName}
                          className="w-10 h-14 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{listing.cardName}</span>
                          {listing.isFoil && <Badge variant="secondary" className="text-xs">Foil</Badge>}
                          {!listing.isActive && <span className="text-xs px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Pausada</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {listing.setName ?? '—'} · {listing.condition} · x{listing.quantity} · {listing.language.toUpperCase()}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold">${listing.price.toFixed(2)}</div>
                        {listing.priceRef && (
                          <div className="text-xs text-muted-foreground line-through">${listing.priceRef.toFixed(2)}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(listing.id, listing.isActive)}
                          title={listing.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {listing.isActive
                            ? <ToggleRight className="h-4 w-4 text-primary" />
                            : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant={isEditing ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => isEditing ? cancelEdit() : startEdit(listing)}
                          title="Editar"
                        >
                          {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
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

                    {/* Inline edit panel */}
                    {isEditing && (
                      <div className="border-t border-border bg-muted/30 p-3 space-y-3">
                        <div className="flex flex-wrap gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Precio (USD)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editDraft.price}
                              onChange={(e) => setEditDraft((d) => ({ ...d, price: e.target.value }))}
                              className="h-8 w-28 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Cantidad</label>
                            <Input
                              type="number"
                              min="1"
                              value={editDraft.quantity}
                              onChange={(e) => setEditDraft((d) => ({ ...d, quantity: e.target.value }))}
                              className="h-8 w-20 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Condición</label>
                            <select
                              value={editDraft.condition}
                              onChange={(e) => setEditDraft((d) => ({ ...d, condition: e.target.value }))}
                              className="h-8 text-sm border border-border rounded px-2 bg-background"
                            >
                              {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8"
                            onClick={() => openPrintPicker(listing)}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                            Cambiar edición
                          </Button>
                          <div className="flex gap-2 ml-auto">
                            <Button size="sm" variant="ghost" className="h-8" onClick={cancelEdit}>
                              Cancelar
                            </Button>
                            <Button size="sm" className="gap-1.5 h-8" onClick={saveEdit} disabled={saving}>
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Guardar
                            </Button>
                          </div>
                        </div>

                        {/* Print picker */}
                        {showPrints && (
                          <div className="border-t border-border pt-3">
                            {loadingPrints ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : prints.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">No se encontraron ediciones</p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 max-h-60 overflow-y-auto">
                                {prints.map((print) => (
                                  <button
                                    key={print.id}
                                    type="button"
                                    onClick={() => selectPrint(listing.id, print, listing.isFoil)}
                                    className={`group relative flex flex-col rounded-lg border overflow-hidden hover:border-primary transition-colors text-left ${
                                      listing.scryfallId === print.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                                    }`}
                                  >
                                    {print.imageUrl ? (
                                      <img src={print.imageUrl} alt={print.set_name} className="w-full aspect-[2/3] object-cover" />
                                    ) : (
                                      <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        {print.set.toUpperCase()}
                                      </div>
                                    )}
                                    <div className="p-1 bg-card">
                                      <p className="text-[10px] font-medium leading-tight truncate">{print.set_name}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {print.set.toUpperCase()} #{print.collector_number}
                                        {(listing.isFoil ? print.prices.usd_foil : print.prices.usd)
                                          ? ` · $${listing.isFoil ? print.prices.usd_foil : print.prices.usd}`
                                          : ''}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        </>)}

      </main>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <AddCardDialog open={addOpen} onOpenChange={setAddOpen} onSave={publishCard} />
      <AddSealedDialog open={addSealedOpen} onOpenChange={setAddSealedOpen} onSave={publishSealed} />
    </div>
  )
}

// ─── OrderList sub-component ────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:   { label: 'Pendiente',  icon: <Clock className="h-3.5 w-3.5" />,        cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  completed: { label: 'Concretada', icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelada',  icon: <XCircle className="h-3.5 w-3.5" />,      cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

function OrderList({
  orders,
  role,
  loading,
  onUpdateStatus,
}: {
  orders: Order[]
  role: 'seller' | 'buyer'
  loading: boolean
  onUpdateStatus?: (id: string, status: 'completed' | 'cancelled') => void
}) {
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  const pending   = orders.filter((o) => o.status === 'pending')
  const completed = orders.filter((o) => o.status === 'completed')
  const cancelled = orders.filter((o) => o.status === 'cancelled')

  const totalSold  = completed.reduce((s, o) => s + o.price * o.quantity, 0)
  const totalSpent = role === 'buyer' ? completed.reduce((s, o) => s + o.price * o.quantity, 0) : 0

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>{role === 'seller' ? 'Todavía no recibiste ningún pedido.' : 'Todavía no hiciste ninguna compra.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {role === 'seller' && completed.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">pedidos totales</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-green-400">${totalSold.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">vendido</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">concretadas</p>
          </div>
        </div>
      )}

      {/* Order rows */}
      {[
        { group: pending,   title: 'Pendientes' },
        { group: completed, title: 'Concretadas' },
        { group: cancelled, title: 'Canceladas' },
      ].filter(({ group }) => group.length > 0).map(({ group, title }) => (
        <div key={title}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h3>
          <div className="space-y-2">
            {group.map((order) => {
              const s = STATUS_STYLES[order.status as keyof typeof STATUS_STYLES]
              const counterpart = role === 'seller' ? order.buyer : order.seller
              return (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  {order.imageUrl ? (
                    <img src={order.imageUrl} alt={order.cardName} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{order.cardName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.setName} · {order.condition}{order.isFoil ? ' Foil' : ''} · x{order.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {role === 'seller' ? 'Comprador' : 'Vendedor'}: <span className="text-foreground">{counterpart.name}</span>
                      {counterpart.phone && (
                        <a
                          href={`https://wa.me/${counterpart.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-green-400 hover:text-green-300"
                        >
                          WhatsApp
                        </a>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">${(order.price * order.quantity).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>

                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium flex-shrink-0 ${s.cls}`}>
                    {s.icon} {s.label}
                  </div>

                  {/* Seller actions for pending orders */}
                  {role === 'seller' && order.status === 'pending' && onUpdateStatus && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      >
                        <XCircle className="h-3 w-3" /> Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
