'use client'
import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, Link2Off, Camera, Copy, Share2, User,
} from 'lucide-react'
import { toSlug } from '@/lib/slug'

export default function PerfilPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [mpConnected, setMpConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status !== 'authenticated') return
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setName(d?.name ?? '')
        setPhone(d?.phone ?? '')
        setImagePreview(d?.image ?? null)
        setMpConnected(d?.mpConnected ?? false)
      })
      .finally(() => setLoading(false))
  }, [status])

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no puede superar 2 MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), image: imagePreview }),
      })
      if (!res.ok) throw new Error()
      await update() // refresh NextAuth session
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
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

  const slug = name ? toSlug(name) : ''
  const publicUrl = slug ? `https://magic.brolas.com.ar/${slug}` : ''

  if (status === 'loading' || loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">Mi perfil</h1>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow hover:bg-primary/90 transition"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            <p className="text-xs text-muted-foreground">JPG, PNG o GIF · máx 2 MB</p>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 2901 123456" />
            <p className="text-xs text-muted-foreground">Con código de país. Los compradores te escriben directo a este número.</p>
          </div>

          {/* Guardar */}
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar cambios
          </Button>

          {/* Link público */}
          {publicUrl && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                Tu carpeta pública
              </div>
              <div className="flex items-center gap-2">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 font-mono text-sm text-primary hover:underline truncate">
                  magic.brolas.com.ar/{slug}
                </a>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado') }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </button>
              </div>
            </div>
          )}

          {/* Mercado Pago */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.6 12.2c0 5.8-4.7 10.6-10.6 10.6S1.4 18 1.4 12.2 6.1 1.6 12 1.6s10.6 4.7 10.6 10.6z" fill="#009EE3"/><path d="M10.4 8.2H14c1.8 0 3 1.2 2.8 2.8-.2 2-1.8 3.2-3.8 3.2h-.8l-.4 2.4H9.4l1-8.4zm2 4.4c.8 0 1.4-.4 1.6-1.2.2-.6-.2-1-1-1h-.8l-.4 2.2h.6z" fill="#fff"/></svg>
                Mercado Pago
              </div>
              {mpConnected
                ? <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Conectado</span>
                : <span className="text-xs text-muted-foreground">No conectado</span>
              }
            </div>

            {mpConnected ? (
              <>
                <p className="text-xs text-muted-foreground">Los compradores pueden pagarte directo desde el carrito.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleMpDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2Off className="h-3.5 w-3.5" />}
                  Desconectar
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Conectá tu cuenta para recibir pagos directo en el carrito.</p>
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => { window.location.href = '/api/mp/connect' }}
                >
                  Conectar Mercado Pago
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
