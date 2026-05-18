'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, Check, X } from 'lucide-react'
import { parseCardList } from '@/lib/moxfield'

const MAX = 300

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: (added: number) => void
}

export default function WishlistImportDialog({ open, onOpenChange, onImported }: Props) {
  const [text, setText] = React.useState('')
  const [step, setStep] = React.useState<'input' | 'review' | 'importing'>('input')
  const [names, setNames] = React.useState<string[]>([])
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  const handleParse = () => {
    setError(null)
    const cards = parseCardList(text)
    if (cards.length === 0) { setError('No se encontraron cartas. Verificá el formato.'); return }
    const unique = [...new Map(cards.map(c => [c.name.toLowerCase(), c.name])).values()]
    setNames(unique.slice(0, MAX))
    setStep('review')
  }

  const handleImport = async () => {
    setStep('importing')
    setProgress(0)
    let added = 0
    for (let i = 0; i < names.length; i++) {
      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardName: names[i] }),
        })
        if (res.ok) added++
      } catch {}
      setProgress(i + 1)
    }
    onImported(added)
    handleClose()
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => { setText(''); setStep('input'); setNames([]); setProgress(0); setError(null) }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar wishlist desde Moxfield</DialogTitle>
          <DialogDescription>
            Pegá el texto exportado de tu deck. Solo se guardan los nombres (máx. {MAX} cartas únicas).
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">¿Cómo exportar de Moxfield?</p>
              <p>1. Abrí tu deck en moxfield.com</p>
              <p>2. Hacé click en <strong>Export</strong> → <strong>Text</strong></p>
              <p>3. Copiás todo y lo pegás abajo</p>
            </div>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"4 Lightning Bolt\n2 Island\n1 Black Lotus (LEA) 4"}
              className="font-mono text-sm"
              rows={10}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full gap-2" onClick={handleParse} disabled={!text.trim()}>
              <Upload className="h-4 w-4" />
              Procesar lista
            </Button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{names.length}</span> cartas únicas listas para agregar a tu wishlist
              </p>
              <Button variant="outline" size="sm" onClick={() => setStep('input')}>Volver</Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 max-h-60 overflow-y-auto p-3 space-y-1">
              {names.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
            <Button className="w-full gap-2" onClick={handleImport}>
              <Upload className="h-4 w-4" />
              Agregar {names.length} cartas a mi wishlist
            </Button>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Agregando cartas… {progress} / {names.length}
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(progress / names.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
