'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface SealedFormData {
  title: string
  description: string
  imageUrl: string
  price: number
  tag: string
}

const TAGS = ['SOBRES', 'MAZO COMMANDER', 'MAZO PAUPER', 'BUNDLE', 'PRECON', 'OTROS']

interface AddSealedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: SealedFormData) => Promise<void>
  initial?: Partial<SealedFormData>
  isEdit?: boolean
}

export function AddSealedDialog({ open, onOpenChange, onSave, initial, isEdit }: AddSealedDialogProps) {
  const [form, setForm] = React.useState<SealedFormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    imageUrl: initial?.imageUrl ?? '',
    price: initial?.price ?? 0,
    tag: initial?.tag ?? 'OTROS',
  })

  // Sync form when initial changes (e.g. opening edit for different listing)
  React.useEffect(() => {
    if (open && initial) {
      setForm({
        title: initial.title ?? '',
        description: initial.description ?? '',
        imageUrl: initial.imageUrl ?? '',
        price: initial.price ?? 0,
        tag: initial.tag ?? 'OTROS',
      })
      setImageSearch('')
    }
  }, [open, initial])
  const [saving, setSaving] = React.useState(false)
  const [imageSearch, setImageSearch] = React.useState('')
  const [imageSuggestions, setImageSuggestions] = React.useState<string[]>([])
  const [showImageSugg, setShowImageSugg] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (field: keyof SealedFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Autocomplete para imagen de portada
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (imageSearch.length < 2) { setImageSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/scryfall/autocomplete?q=${encodeURIComponent(imageSearch)}`)
        const data = await res.json()
        setImageSuggestions((data.data ?? []).slice(0, 6))
        setShowImageSugg(true)
      } catch { setImageSuggestions([]) }
    }, 250)
  }, [imageSearch])

  const selectCoverCard = async (name: string) => {
    setImageSearch(name)
    setShowImageSugg(false)
    try {
      const res = await fetch(`/api/scryfall?name=${encodeURIComponent(name)}`)
      if (res.ok) {
        const card = await res.json()
        const url = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal
        if (url) set('imageUrl', url)
      }
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price) return
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al publicar')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({ title: '', description: '', imageUrl: '', price: 0, tag: 'OTROS' })
    setImageSearch('')
    setImageSuggestions([])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar publicación' : 'Publicar producto sellado'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag */}
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tag', t)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    form.tag === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Mazo Commander Atraxa upgrades"
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label>Precio (USD) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price || ''}
                onChange={(e) => set('price', e.target.value)}
                className="pl-6"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descripción / Lista de cartas</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={"Mazo Atraxa upgrades:\n1x Doubling Season\n1x Vorinclex\n..."}
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          {/* Cover image via card search */}
          <div className="space-y-1.5">
            <Label>Imagen de portada</Label>
            <div className="relative">
              <Input
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                onFocus={() => imageSuggestions.length > 0 && setShowImageSugg(true)}
                onBlur={() => setTimeout(() => setShowImageSugg(false), 150)}
                placeholder="Buscá una carta para usar como portada..."
              />
              {showImageSugg && imageSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border bg-popover rounded-lg shadow-lg overflow-hidden">
                  {imageSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onMouseDown={() => selectCoverCard(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* URL manual override */}
            <Input
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="O pegá una URL de imagen directamente"
              className="text-xs"
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                className="h-24 rounded-lg object-cover border border-border"
              />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? 'Guardar cambios' : 'Publicar producto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
