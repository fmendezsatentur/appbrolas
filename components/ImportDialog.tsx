'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload } from 'lucide-react'
import type { ParsedCard } from '@/lib/moxfield'
import { searchCardByName, getCardImageUrl, getCardPrice } from '@/lib/scryfall'

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
  const [parsed, setParsed] = React.useState<ParsedCard[]>([])
  const [enriched, setEnriched] = React.useState<CardToPublish[]>([])
  const [step, setStep] = React.useState<'input' | 'review'>('input')
  const [enrichProgress, setEnrichProgress] = React.useState(0)

  const handleParse = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/moxfield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'text' ? { text } : { url }),
      })
      const data = await res.json()
      if (data.cards) {
        setParsed(data.cards)
        await enrichCards(data.cards)
      }
    } finally {
      setLoading(false)
    }
  }

  const enrichCards = async (cards: ParsedCard[]) => {
    setEnrichProgress(0)
    const results: CardToPublish[] = []

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      try {
        const res = await fetch(`/api/scryfall?name=${encodeURIComponent(card.name)}`)
        if (res.ok) {
          const sf = await res.json()
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
            Pegá el texto exportado de tu deck o la URL pública del deck en Moxfield.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={tab === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('text')}
              >
                Texto
              </Button>
              <Button
                variant={tab === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab('url')}
              >
                URL de Moxfield
              </Button>
            </div>

            {tab === 'text' ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  En Moxfield: Export → Text o MTGO. Formato: <code>4 Lightning Bolt</code>
                </p>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="4 Lightning Bolt&#10;2 Island&#10;1 Black Lotus"
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  El deck debe ser público en Moxfield.
                </p>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.moxfield.com/decks/..."
                />
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleParse}
              disabled={loading || (tab === 'text' ? !text.trim() : !url.trim())}
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
              {enriched.map((card, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                  {card.imageUrl && (
                    <img src={card.imageUrl} alt={card.cardName} className="w-10 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{card.cardName}</p>
                    <p className="text-xs text-muted-foreground">{card.setName} · x{card.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={card.price}
                      onChange={(e) => updateCard(i, 'price', parseFloat(e.target.value))}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                  <select
                    value={card.condition}
                    onChange={(e) => updateCard(i, 'condition', e.target.value)}
                    className="text-xs border border-border rounded px-1 py-1 bg-background"
                  >
                    {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
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
