'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { ShoppingCart, type CartItem } from '@/components/ui/shopping-cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CarritoPage() {
  const router = useRouter()
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
    // Agrupamos por vendedor para hacer múltiples mensajes de WhatsApp
    const bySeller: Record<string, CartItem[]> = {}
    for (const item of cart) {
      if (!bySeller[item.sellerName]) bySeller[item.sellerName] = []
      bySeller[item.sellerName].push(item)
    }

    const sellerNames = Object.keys(bySeller)

    if (sellerNames.length === 1) {
      const seller = sellerNames[0]
      const items = bySeller[seller]
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const lines = items
        .map((i) => `• ${i.quantity}x ${i.name} (${i.condition}${i.isFoil ? ' Foil' : ''}) — $${(i.price * i.quantity).toFixed(2)}`)
        .join('\n')
      const msg = encodeURIComponent(
        `Hola ${seller}! Quiero comprar las siguientes cartas:\n\n${lines}\n\nTotal: $${total.toFixed(2)}\n\n¿Las tenés disponibles?`
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    } else {
      // Múltiples vendedores: mostramos un resumen
      const totalGeneral = cart.reduce((s, i) => s + i.price * i.quantity, 0)
      const resumen = sellerNames
        .map((seller) => {
          const items = bySeller[seller]
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
          const lines = items.map((i) => `  - ${i.quantity}x ${i.name}: $${(i.price * i.quantity).toFixed(2)}`).join('\n')
          return `*${seller}* ($${subtotal.toFixed(2)}):\n${lines}`
        })
        .join('\n\n')

      const msg = encodeURIComponent(
        `Pedido Magic Market:\n\n${resumen}\n\n*Total general: $${totalGeneral.toFixed(2)}*`
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank')
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
      </main>
    </div>
  )
}
