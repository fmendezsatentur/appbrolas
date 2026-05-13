'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, Search, AlertCircle } from 'lucide-react'
import type { ParsedCard } from '@/lib/moxfield'
import { getCardImageUrl, getCardPrice } from '@/lib/scryfall'

export interface CardToPublish {
  cardName: string
  setName?: string
  setCode?: string
  collectorNumber?: string
  quantity: number
  price: number
  priceRef?: number
  imageUrl?: string
  scryfallId?: string
  colors?: string[]
  condition: string
  isFoil: boolean
  language: string
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (cards: CardToPublish[]) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [tab, setTab] = React.useState<'text' | 'url'>('text')
  const [text, setText] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [parsed, setParsed] = React.useState<ParsedCard[]>([])
  const [enriched, setEnriched] = React.useState<CardToPublish[]>([])
  const [step, setStep] = React.useState<'input' | 'review'>('input')
  const [enrichProgress, setEnrichProgress] = React.useState(0)

  const handleParse = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/moxfield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'text' ? { text } : { url }),
      })
      const data = await res.json()
      if (data.cards && data.cards.length > 0) {
        setParsed(data.cards)
        await enrichCards(data.cards)
      } else if (data.error) {
        setError(data.error)
      } else {
        setError('No se encontraron cartas. Verificá el formato.')
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const fetchScryfallCard = async (card: ParsedCard) => {
    const url = card.setCode && card.collectorNumber
      ? `/api/scryfall?set=${card.setCode}&number=${encodeURIComponent(card.collectorNumber)}&name=${encodeURIComponent(card.name)}`
      : `/api/scryfall?name=${encodeURIComponent(card.name)}`
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  }

  const enrichCards = async (cards: ParsedCard[]) => {
    setEnrichProgress(0)
    const results: CardToPublish[] = []

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      try {
        const sf = await fetchScryfallCard(card)
        if (sf && !sf.error) {
          const priceRef = getCardPrice(sf) ?? undefined
          results.push({
            cardName: sf.name,
            setName: sf.set_name,
            setCode: sf.set,
            collectorNumber: sf.collector_number,
            quantity: card.quantity,
            price: priceRef ?? 0.5,
            priceRef,
            imageUrl: getCardImageUrl(sf),
            scryfallId: sf.id,
            colors: sf.color_identity ?? [],
            condition: 'NM',
            isFoil: false,
            language: 'en',
          })
        } else {
          results.push({
            cardName: card.name,
            setCode: card.setCode,
            collectorNumber: card.collectorNumber,
            quantity: card.quantity,
            price: 0.5,
            condition: 'NM',
            isFoil: false,
            language: 'en',
            scryfallId: undefined,
          })
        }
      } catch {
        results.push({
          cardName: card.name,
          quantity: card.quantity,
          price: 0.5,
          condition: 'NM',
          isFoil: false,
          language: 'en',
        })
      }
      setEnrichProgress(Math.round(((i + 1) / cards.length) * 100))
    }

    setEnriched(results)
    setStep('review')
  }

  const reSearchCard = async (i: number) => {
    const card = enriched[i]
    setEnriched((prev) => prev.map((c, idx) => idx === i ? { ...c, _searching: true } as any : c))
    try {
      const res = await fetch(`/api/scryfall?name=${encodeURIComponent(card.cardName)}`)
      if (res.ok) {
        const sf = await res.json()
        if (!sf.error) {
          const priceRef = getCardPrice(sf) ?? undefined
          setEnriched((prev) => prev.map((c, idx) => idx === i ? {
            ...c,
            cardName: sf.name,
            setName: sf.set_name,
            setCode: sf.set,
            collectorNumber: sf.collector_number,
            price: priceRef ?? c.price,
            priceRef,
            imageUrl: getCardImageUrl(sf),
            scryfallId: sf.id,
          } as any : c))
          return
        }
      }
    } catch {}
    setEnriched((prev) => prev.map((c, idx) => idx === i ? { ...c, _searching: false } as any : c))
  }

  const updateCard = (i: number, field: keyof CardToPublish, value: any) => {
    setEnriched((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  const handleConfirm = () => {
    onImport(enriched)
    onOpenChange(false)
    setStep('input')
    setText('')
    setUrl('')
    setParsed([])
    setEnriched([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar desde Moxfield</DialogTitle>
          <DialogDescription>
            En Moxfield abrí tu deck → <strong>Export → Text</strong>, copiás todo y lo pegás acá.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">¿Cómo exportar de Moxfield?</p>
              <p>1. Abrí tu deck en moxfield.com</p>
              <p>2. Hacé click en <strong>Export</strong> (arriba a la derecha)</p>
              <p>3. Elegí <strong>Text</strong> o <strong>MTGO</strong></p>
              <p>4. Copiás todo y lo pegás abajo</p>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"4 Lightning Bolt\n2 Island\n1 Black Lotus (LEA) 4"}
              className="font-mono text-sm"
              rows={10}
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleParse}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Obteniendo precios... {enrichProgress > 0 && `${enrichProgress}%`}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar y buscar precios
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{enriched.length} cartas listas para publicar</p>
              <Button variant="outline" size="sm" onClick={() => setStep('input')}>
                Volver
              </Button>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {enriched.map((card, i) => {
                const failed = !card.scryfallId
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-2 border rounded-lg ${failed ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}
                  >
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.cardName} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Input
                          value={card.cardName}
                          onChange={(e) => updateCard(i, 'cardName', e.target.value)}
                          className={`h-7 text-sm font-medium ${failed ? 'border-destructive/50' : ''}`}
                          placeholder="Nombre de la carta"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => reSearchCard(i)}
                          title="Buscar en Scryfall"
                        >
                          <Search className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{card.setName ?? (failed ? 'No encontrada — editá el nombre y presioná la lupa' : '')} · x{card.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={card.price}
                        onChange={(e) => updateCard(i, 'price', parseFloat(e.target.value))}
                        className="w-20 h-7 text-sm"
                      />
                    </div>
                    <select
                      value={card.condition}
                      onChange={(e) => updateCard(i, 'condition', e.target.value)}
                      className="text-xs border border-border rounded px-1 py-1 bg-background flex-shrink-0"
                    >
                      {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <Button className="w-full" onClick={handleConfirm}>
              Publicar {enriched.length} cartas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
