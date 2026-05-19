'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  colors?: string[]
  language: string
  notes?: string
}

interface PrintOption {
  id: string
  name: string
  set: string
  set_name: string
  collector_number: string
  imageUrl: string | null
  prices: { retail: number | null; retail_foil: number | null }
  released_at: string
  colors: string[]
}

interface AddCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (card: CardFormData) => Promise<void>
  initialData?: Partial<CardFormData>
}

export function AddCardDialog({ open, onOpenChange, onSave, initialData }: AddCardDialogProps) {
  const [cardName, setCardName] = React.useState(initialData?.cardName ?? '')
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [prints, setPrints] = React.useState<PrintOption[]>([])
  const [selectedPrint, setSelectedPrint] = React.useState<PrintOption | null>(null)
  const [loadingPrints, setLoadingPrints] = React.useState(false)
  const [step, setStep] = React.useState<'name' | 'print' | 'details'>('name')
  const [form, setForm] = React.useState({
    condition: initialData?.condition ?? 'NM',
    isFoil: initialData?.isFoil ?? false,
    quantity: initialData?.quantity ?? 1,
    price: initialData?.price ?? 0,
    language: initialData?.language ?? 'en',
    notes: initialData?.notes ?? '',
  })
  const [saving, setSaving] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Autocomplete mientras escribe
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (cardName.length < 2) { setSuggestions([]); return }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/scryfall/autocomplete?q=${encodeURIComponent(cardName)}`)
        const data = await res.json()
        setSuggestions(data.data ?? [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 250)
  }, [cardName])

  const selectName = async (name: string) => {
    setCardName(name)
    setSuggestions([])
    setShowSuggestions(false)
    setLoadingPrints(true)
    setStep('print')
    try {
      const res = await fetch(`/api/scryfall/prints?name=${encodeURIComponent(name)}`)
      const data = await res.json()
      setPrints(data.data ?? [])
    } finally {
      setLoadingPrints(false)
    }
  }

  const selectPrint = (print: PrintOption) => {
    setSelectedPrint(print)
    const priceRef = form.isFoil
      ? print.prices.retail_foil ?? undefined
      : print.prices.retail ?? undefined
    setForm((prev) => ({ ...prev, price: priceRef ?? prev.price }))
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPrint) return
    setSaving(true)
    try {
      await onSave({
        cardName: selectedPrint.name,
        setName: selectedPrint.set_name,
        setCode: selectedPrint.set,
        collectorNumber: selectedPrint.collector_number,
        imageUrl: selectedPrint.imageUrl ?? undefined,
        scryfallId: selectedPrint.id,
        colors: selectedPrint.colors,
        priceRef: form.isFoil
          ? selectedPrint.prices.retail_foil ?? undefined
          : selectedPrint.prices.retail ?? undefined,
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      })
      onOpenChange(false)
      resetDialog()
    } catch (err: any) {
      toast.error(err?.message ?? 'Error publicando carta')
    } finally {
      setSaving(false)
    }
  }

  const resetDialog = () => {
    setCardName('')
    setSuggestions([])
    setPrints([])
    setSelectedPrint(null)
    setStep('name')
    setForm({ condition: 'NM', isFoil: false, quantity: 1, price: 0, language: 'en', notes: '' })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetDialog() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'name' && 'Buscar carta'}
            {step === 'print' && `Elegir edición — ${cardName}`}
            {step === 'details' && `Detalles — ${selectedPrint?.set_name}`}
          </DialogTitle>
        </DialogHeader>

        {/* PASO 1: nombre con autocomplete */}
        {step === 'name' && (
          <div className="space-y-3">
            <div className="relative">
              <Input
                autoFocus
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cardName.trim()) selectName(cardName.trim())
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                placeholder="Lightning Bolt, Black Lotus..."
                className="text-base"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-popover rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => selectName(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Escribí el nombre en inglés y seleccioná de las sugerencias.
            </p>
          </div>
        )}

        {/* PASO 2: elegir edición */}
        {step === 'print' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setStep('name')}>← Volver</Button>
            {loadingPrints ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {prints.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPrint(p)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-center"
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.set_name} className="w-full rounded-md" />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                    <span className="text-xs font-medium leading-tight">{p.set_name}</span>
                    <span className="text-xs text-muted-foreground">{p.released_at?.slice(0, 4)}</span>
                    {p.prices.retail && (
                      <span className="text-xs text-primary font-bold">${p.prices.retail.toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: detalles */}
        {step === 'details' && selectedPrint && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep('print')}>← Cambiar edición</Button>

            <div className="flex gap-4">
              {selectedPrint.imageUrl && (
                <img src={selectedPrint.imageUrl} alt={cardName} className="w-28 rounded-lg border border-border flex-shrink-0" />
              )}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Condición</Label>
                    <select
                      value={form.condition}
                      onChange={(e) => set('condition', e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      {[['NM','Near Mint'],['LP','Lightly Played'],['MP','Moderately Played'],['HP','Heavily Played'],['DMG','Damaged']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Idioma</Label>
                    <select
                      value={form.language}
                      onChange={(e) => set('language', e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      {[['en','Inglés'],['es','Español'],['pt','Portugués'],['jp','Japonés'],['de','Alemán'],['fr','Francés']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Cantidad</Label>
                    <Input type="number" min={1} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Precio (USD)
                      {(form.isFoil ? selectedPrint.prices.retail_foil : selectedPrint.prices.retail) && (
                        <span className="text-xs text-muted-foreground ml-1">
                          · Ref CK: ${form.isFoil ? selectedPrint.prices.retail_foil?.toFixed(2) : selectedPrint.prices.retail?.toFixed(2)}
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number" step="0.01" min={0}
                        value={form.price}
                        onChange={(e) => set('price', e.target.value)}
                        className="pl-6" required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" id="foil" checked={form.isFoil}
                    onChange={(e) => {
                      set('isFoil', e.target.checked)
                      const p = e.target.checked ? selectedPrint.prices.retail_foil : selectedPrint.prices.retail
                      if (p) set('price', p)
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="foil">Foil</Label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notas (opcional)</Label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Estado especial, defectos, etc." />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Publicar carta
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
