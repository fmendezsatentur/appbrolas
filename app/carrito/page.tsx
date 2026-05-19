'use client'
import * as React from 'react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { type CartItem } from '@/components/ui/shopping-cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, Loader2, CreditCard, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface SellerGroup {
  sellerId?: string
  sellerName: string
  sellerPhone: string | null
  sellerMpConnected: boolean
  items: CartItem[]
  subtotal: number
}

export default function CarritoPage() {
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [payingMp, setPayingMp] = React.useState<string | null>(null) // sellerName being paid

  React.useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('magic-cart') ?? '[]')) } catch { setCart([]) }
  }, [])

  const syncCart = (c: CartItem[]) => {
    setCart(c)
    localStorage.setItem('magic-cart', JSON.stringify(c))
  }

  const removeItem = (id: string) => {
    syncCart(cart.filter(i => i.id !== id))
    toast.success('Carta removida')
  }

  const changeQty = (id: string, qty: number) => {
    syncCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  // Group by seller
  const groups: SellerGroup[] = React.useMemo(() => {
    const map = new Map<string, SellerGroup>()
    for (const item of cart) {
      const key = item.sellerName
      if (!map.has(key)) {
        map.set(key, {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerPhone: item.sellerPhone,
          sellerMpConnected: item.sellerMpConnected ?? false,
          items: [],
          subtotal: 0,
        })
      }
      const g = map.get(key)!
      g.items.push(item)
      g.subtotal += item.price * item.quantity
    }
    return [...map.values()]
  }, [cart])

  const payWithMp = async (group: SellerGroup) => {
    if (!group.sellerId) return
    setPayingMp(group.sellerName)
    try {
      const listingIds = group.items.map(i => i.listingId)
      const res = await fetch('/api/mp/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds, sellerId: group.sellerId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Error al iniciar pago'); return }

      // Remove items from cart and redirect to MP
      syncCart(cart.filter(i => i.sellerName !== group.sellerName))
      window.location.href = data.initPoint
    } catch {
      toast.error('Error al conectar con Mercado Pago')
    } finally {
      setPayingMp(null)
    }
  }

  const payWithWhatsApp = async (group: SellerGroup) => {
    const listingIds = group.items.map(i => i.listingId)
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds }),
      })
    } catch {}

    syncCart(cart.filter(i => i.sellerName !== group.sellerName))

    const lines = group.items.map(i =>
      `• ${i.quantity}x ${i.name} (${i.condition}${i.isFoil ? ' Foil' : ''}) — $${(i.price * i.quantity).toFixed(2)}`
    ).join('\n')
    const msg = encodeURIComponent(
      `Hola ${group.sellerName}! Quiero comprar estas cartas de Magic Market:\n\n${lines}\n\nTotal: $${group.subtotal.toFixed(2)}\n\n¿Las tenés disponibles?`
    )
    const url = group.sellerPhone
      ? `https://wa.me/${group.sellerPhone.replace(/\D/g, '')}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al marketplace
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Carrito</h1>
          {cart.length > 0 && (
            <span className="text-sm text-muted-foreground">{cart.length} {cart.length === 1 ? 'carta' : 'cartas'} · Total: ${total.toFixed(2)}</span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="text-4xl mb-3">🛒</p>
            <p>Tu carrito está vacío</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">Explorar marketplace</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.sellerName} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Seller header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{group.sellerName}</span>
                    {group.sellerMpConnected && (
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">
                        💳 MP disponible
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold">${group.subtotal.toFixed(2)}</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-14 object-contain rounded flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded bg-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.condition}{item.isFoil ? ' · Foil' : ''}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => item.quantity > 1 && changeQty(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                          >−</button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => item.quantity < item.maxQuantity && changeQty(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                            className="w-6 h-6 rounded border border-border flex items-center justify-center text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                          >+</button>
                        </div>
                        <span className="text-sm font-semibold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                        <button type="button" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment actions */}
                <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row gap-2">
                  {group.sellerMpConnected && (
                    <Button
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                      onClick={() => payWithMp(group)}
                      disabled={!!payingMp}
                    >
                      {payingMp === group.sellerName
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CreditCard className="h-4 w-4" />}
                      Pagar con Mercado Pago
                    </Button>
                  )}
                  <Button
                    variant={group.sellerMpConnected ? 'outline' : 'default'}
                    className={`flex-1 gap-2 ${!group.sellerMpConnected ? '' : ''}`}
                    onClick={() => payWithWhatsApp(group)}
                    disabled={!!payingMp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {group.sellerMpConnected ? 'Coordinar por WhatsApp' : 'Enviar pedido por WhatsApp'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
