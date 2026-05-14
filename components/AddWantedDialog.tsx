'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

interface Props {
  onCreated: () => void
}

export default function AddWantedDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [cardName, setCardName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCardNameChange(v: string) {
    setCardName(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/scryfall/autocomplete?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        setSuggestions((data.data ?? []).slice(0, 6))
        setShowSugg(true)
      } catch { setSuggestions([]) }
    }, 250)
  }

  async function selectCard(name: string) {
    setCardName(name)
    setShowSugg(false)
    setSuggestions([])
    try {
      const res = await fetch(`/api/scryfall?name=${encodeURIComponent(name)}`)
      if (res.ok) {
        const card = await res.json()
        const url = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal
        if (url) setImageUrl(url)
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/wanted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardName, quantity, notes, imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setOpen(false)
      reset()
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setCardName(''); setQuantity('1'); setNotes(''); setImageUrl('')
    setSuggestions([]); setError('')
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-amber-700 hover:bg-amber-600 text-white font-semibold">
        + Busco una carta
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Qué carta buscás?</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre de la carta *</Label>
              <div className="relative mt-1">
                <Input
                  value={cardName}
                  onChange={e => handleCardNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                  placeholder="Ej: Lightning Bolt"
                  required
                />
                {showSugg && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-popover rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map(s => (
                      <button key={s} type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onMouseDown={() => selectCard(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {imageUrl && (
              <div className="flex justify-center">
                <div className="relative h-32 w-24 rounded overflow-hidden border border-border">
                  <Image src={imageUrl} alt={cardName} fill className="object-contain" sizes="96px" />
                </div>
              </div>
            )}

            <div>
              <Label>Cantidad que buscás</Label>
              <Input type="number" min="1" max="20" value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="mt-1 w-24" />
            </div>

            <div>
              <Label>Notas (edición, condición, etc.)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ej: cualquier edición, NM o LP" rows={2} className="mt-1" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-amber-700 hover:bg-amber-600 text-white">
              {loading ? 'Publicando...' : 'Publicar búsqueda'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
