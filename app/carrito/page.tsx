'use client'
import * as React from 'react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { ShoppingCart, type CartItem } from '@/components/ui/shopping-cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CarritoPage() {
  const [cart, setCart] = React.useState<CartItem[]>([])

  React.useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('magic-cart') ?? '[]'))
    } catch {
      setCart([])
    }
  }, [])

  const syncCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('magic-cart', JSON.stringify(newCart))
  }

  const handleQuantityChange = (id: string, qty: number) => {
    syncCart(cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
  }

  const handleRemove = (id: string) => {
    syncCart(cart.filter((i) => i.id !== id))
    toast.success('Carta removida del carrito')
  }

  const handleCheckout = () => {
    if (cart.length === 0) return

    // Agrupar por vendedor
    const bySeller: Record<string, { items: CartItem[]; phone: string | null }> = {}
    for (const item of cart) {
      if (!bySeller[item.sellerName]) {
        bySeller[item.sellerName] = { items: [], phone: item.sellerPhone }
      }
      bySeller[item.sellerName].items.push(item)
    }

    const sellers = Object.entries(bySeller)

    // Un mensaje de WhatsApp por vendedor
    for (const [sellerName, { items, phone }] of sellers) {
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const lines = items
        .map((i) => `• ${i.quantity}x ${i.name} (${i.condition}${i.isFoil ? ' Foil' : ''}) — $${(i.price * i.quantity).toFixed(2)}`)
        .join('\n')

      const msg = encodeURIComponent(
        `Hola ${sellerName}! Quiero comprar estas cartas de Magic Market:\n\n${lines}\n\nSubtotal: $${subtotal.toFixed(2)}\n\n¿Las tenés disponibles?`
      )

      // Si tiene número, abre WhatsApp directo. Si no, abre con texto para que elija.
      const url = phone
        ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`
        : `https://wa.me/?text=${msg}`

      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al marketplace
            </Button>
          </Link>
        </div>

        <ShoppingCart
          items={cart}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={handleRemove}
          onCheckout={handleCheckout}
        />

        {cart.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-border bg-card text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">¿Cómo funciona el checkout?</p>
            {[...new Set(cart.map((i) => i.sellerName))].map((seller) => {
              const sellerItems = cart.filter((i) => i.sellerName === seller)
              const phone = sellerItems[0].sellerPhone
              return (
                <p key={seller}>
                  · <span className="font-medium">{seller}</span>:{' '}
                  {phone ? `se abre WhatsApp directo (${phone})` : 'no tiene número — te mostrará el texto para copiar'}
                </p>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
