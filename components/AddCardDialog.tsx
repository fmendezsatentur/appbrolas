'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Search } from 'lucide-react'

interface AddCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (card: CardFormData) => Promise<void>
  initialData?: Partial<CardFormData>
}

export interface CardFormData {
  cardName: string
  setName?: string
  setCode?: string
  collectorNumber?: string
  condition: string
  isFoil: boolean
  quantity: number
  price: number
  priceRef?: number
  imageUrl?: string
  scryfallId?: string
  language: string
  notes?: string
}

export function AddCardDialog({ open, onOpenChange, onSave, initialData }: AddCardDialogProps) {
  const [form, setForm] = React.useState<CardFormData>({
    cardName: '',
    condition: 'NM',
    isFoil: false,
    quantity: 1,
    price: 0,
    language: 'en',
    ...initialData,
  })
  const [searching, setSearching] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(initialData?.imageUrl ?? null)

  const set = (field: keyof CardFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const searchScryfall = async () => {
    if (!form.cardName.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/scryfall?name=${encodeURIComponent(form.cardName)}`)
      if (res.ok) {
        const card = await res.json()
        const imgUrl =
          card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null
        const priceRef = parseFloat(form.isFoil ? card.prices?.usd_foil : card.prices?.usd) || undefined
        setForm((prev) => ({
          ...prev,
          cardName: card.name,
          setName: card.set_name,
          setCode: card.set,
          collectorNumber: card.collector_number,
          imageUrl: imgUrl ?? prev.imageUrl,
          scryfallId: card.id,
          priceRef,
          price: prev.price || priceRef || 0,
        }))
        setPreview(imgUrl)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar carta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la carta</Label>
            <div className="flex gap-2">
              <Input
                value={form.cardName}
                onChange={(e) => set('cardName', e.target.value)}
                placeholder="Lightning Bolt"
                required
              />
              <Button type="button" variant="outline" size="icon" onClick={searchScryfall} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {preview && (
            <img src={preview} alt={form.cardName} className="w-32 rounded-lg border border-border" />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condición</Label>
              <select
                value={form.condition}
                onChange={(e) => set('condition', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                {[['NM', 'Near Mint'], ['LP', 'Lightly Played'], ['MP', 'Moderately Played'], ['HP', 'Heavily Played'], ['DMG', 'Damaged']].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Idioma</Label>
              <select
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                {[['en', 'Inglés'], ['es', 'Español'], ['pt', 'Portugués'], ['jp', 'Japonés'], ['de', 'Alemán'], ['fr', 'Francés']].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => set('quantity', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Precio (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => set('price', parseFloat(e.target.value))}
                  className="pl-6"
                  required
                />
              </div>
              {form.priceRef && (
                <p className="text-xs text-muted-foreground">Ref TCGPlayer: ${form.priceRef.toFixed(2)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="foil"
              checked={form.isFoil}
              onChange={(e) => set('isFoil', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="foil">Foil</Label>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Estado especial, defectos, etc."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publicar carta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
