'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Link2Off } from 'lucide-react'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const [phone, setPhone] = React.useState('')
  const [mpConnected, setMpConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [disconnecting, setDisconnecting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setPhone(d?.phone ?? ''); setMpConnected(d?.mpConnected ?? false) })
      .finally(() => setLoading(false))
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      toast.success('Número guardado')
      onOpenChange(false)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleMpConnect = () => {
    window.location.href = '/api/mp/connect'
  }

  const handleMpDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/mp/disconnect', { method: 'DELETE' })
      setMpConnected(false)
      toast.success('Mercado Pago desconectado')
    } catch {
      toast.error('Error al desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* WhatsApp */}
            <div className="space-y-2">
              <Label>Número de WhatsApp</Label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 9 2901 123456"
              />
              <p className="text-xs text-muted-foreground">
                Con código de país. Ej: +5492901123456
              </p>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>

            {/* Mercado Pago */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Mercado Pago</Label>
                {mpConnected && (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                  </span>
                )}
              </div>

              {mpConnected ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Los compradores van a poder pagarte directo con MP desde el carrito.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={handleMpDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2Off className="h-3.5 w-3.5" />}
                    Desconectar Mercado Pago
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Conectá tu cuenta para que los compradores puedan pagarte directo desde el carrito.
                  </p>
                  <Button
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={handleMpConnect}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M22.6 12.2c0 5.8-4.7 10.6-10.6 10.6S1.4 18 1.4 12.2 6.1 1.6 12 1.6s10.6 4.7 10.6 10.6z" fill="#009EE3"/>
                      <path d="M10.4 8.2H14c1.8 0 3 1.2 2.8 2.8-.2 2-1.8 3.2-3.8 3.2h-.8l-.4 2.4H9.4l1-8.4zm2 4.4c.8 0 1.4-.4 1.6-1.2.2-.6-.2-1-1-1h-.8l-.4 2.2h.6z" fill="#fff"/>
                    </svg>
                    Conectar Mercado Pago
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
