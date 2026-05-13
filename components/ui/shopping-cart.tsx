'use client'
import * as React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Trash2, ShoppingCart as ShoppingCartIcon } from 'lucide-react'

export interface CartItem {
  id: string
  listingId: string
  name: string
  price: number
  quantity: number
  maxQuantity: number
  imageUrl: string
  sellerName: string
  condition: string
  isFoil: boolean
}

interface ShoppingCartProps {
  items: CartItem[]
  onQuantityChange: (id: string, newQuantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCartIcon className="h-6 w-6" /> Carrito
        </CardTitle>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tu carrito está vacío. ¡Explorá el marketplace!
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border p-3 rounded-lg">
                <img
                  src={item.imageUrl || '/card-placeholder.png'}
                  alt={item.name}
                  className="w-16 h-22 object-cover rounded-md"
                  style={{ aspectRatio: '2/3' }}
                />
                <div className="flex-1 grid gap-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.condition}{item.isFoil ? ' · Foil' : ''} · Vendedor: {item.sellerName}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v >= 1 && v <= item.maxQuantity) onQuantityChange(item.id, v)
                      }}
                      className="w-14 text-center h-7 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-6" />

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            El pago y la entrega se coordinan directamente con cada vendedor.
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-6">
        <Button className="w-full" disabled={items.length === 0} onClick={onCheckout}>
          Enviar pedido por WhatsApp
        </Button>
      </CardFooter>
    </Card>
  )
}
