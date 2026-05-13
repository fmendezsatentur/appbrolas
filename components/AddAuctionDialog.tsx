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

export default function AddAuctionDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageQuery, setImageQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ name: string; image: string; id: string }[]>([])
  const [startingPrice, setStartingPrice] = useState('')
  const [minIncrement, setMinIncrement] = useState('100')
  const [endTime, setEndTime] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const maxDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const maxDateStr = maxDate.toISOString().slice(0, 16)
  const minDateStr = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  function handleImageQueryChange(q: string) {
    setImageQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/scryfall/search?q=${encodeURIComponent(q)}&limit=6`)
        const data = await res.json()
        setSuggestions(data.results ?? [])
      } catch {
        setSuggestions([])
      }
    }, 400)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl, startingPrice, minIncrement, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear subasta'); return }
      setOpen(false)
      resetForm()
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle(''); setDescription(''); setImageUrl(''); setImageQuery('')
    setSuggestions([]); setStartingPrice(''); setMinIncrement('100'); setEndTime('')
    setError('')
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">
        + Nueva subasta
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Crear subasta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-zinc-300">Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Ej: Black Lotus Alpha" className="bg-zinc-800 border-zinc-600 text-white mt-1" />
          </div>

          <div>
            <Label className="text-zinc-300">Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Estado, detalles..." className="bg-zinc-800 border-zinc-600 text-white mt-1" rows={2} />
          </div>

          <div>
            <Label className="text-zinc-300">Imagen de portada</Label>
            <Input value={imageQuery} onChange={e => handleImageQueryChange(e.target.value)}
              placeholder="Buscar carta en Scryfall..." className="bg-zinc-800 border-zinc-600 text-white mt-1" />
            {suggestions.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {suggestions.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => { setImageUrl(s.image); setSuggestions([]); setImageQuery(s.name) }}
                    className={`relative aspect-[63/88] rounded overflow-hidden border-2 transition ${imageUrl === s.image ? 'border-yellow-400' : 'border-transparent hover:border-zinc-500'}`}>
                    <Image src={s.image} alt={s.name} fill className="object-cover" sizes="120px" />
                  </button>
                ))}
              </div>
            )}
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="O pegar URL de imagen directamente" className="bg-zinc-800 border-zinc-600 text-white mt-2" />
            {imageUrl && !suggestions.length && (
              <div className="mt-2 relative h-32 w-24 rounded overflow-hidden border border-zinc-700">
                <Image src={imageUrl} alt="preview" fill className="object-contain" sizes="96px" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300">Precio inicial ($) *</Label>
              <Input type="number" min="0" step="any" value={startingPrice}
                onChange={e => setStartingPrice(e.target.value)} required
                className="bg-zinc-800 border-zinc-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300">Incremento mínimo ($)</Label>
              <Input type="number" min="1" step="any" value={minIncrement}
                onChange={e => setMinIncrement(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-zinc-300">Fecha y hora de cierre * (máx. 3 días)</Label>
            <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
              min={minDateStr} max={maxDateStr} required
              className="bg-zinc-800 border-zinc-600 text-white mt-1" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button type="submit" disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">
            {loading ? 'Creando...' : 'Crear subasta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
