'use client'
import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Loader2, Users, CreditCard, Package, ShoppingBag, Gavel, Heart, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ADMIN_EMAIL = 'fmendezsatentur@gmail.com'

interface Stats {
  users:    { total: number; last7: number; last30: number }
  cards:    { total: number; active: number; last7: number }
  sealed:   { total: number; active: number }
  orders:   { total: number; pending: number; completed: number; cancelled: number; revenue: number; revenue30: number }
  auctions: { total: number; active: number; totalBids: number }
  wishlist: { total: number; users: number }
  wanted:   { total: number }
  topSellers: { name: string; count: number }[]
  activity: { type: string; label: string; at: string }[]
}

const ACTIVITY_ICONS: Record<string, string> = {
  new_user:    '👤',
  new_card:    '🃏',
  new_order:   '🛒',
  new_auction: '🔨',
}

const ACTIVITY_COLORS: Record<string, string> = {
  new_user:    'border-l-blue-500',
  new_card:    'border-l-yellow-500',
  new_order:   'border-l-green-500',
  new_auction: 'border-l-purple-500',
}

function StatCard({ icon, label, value, sub, color = 'text-foreground' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {icon}{label}
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null)

  React.useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && session.user?.email !== ADMIN_EMAIL) { router.push('/'); return }
    if (status === 'authenticated') fetchStats()
  }, [status])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        setStats(await res.json())
        setLastRefresh(new Date())
      }
    } finally { setLoading(false) }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar cartCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { users, cards, sealed, orders, auctions, wishlist, wanted, topSellers, activity } = stats

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={0} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Admin</h1>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">
                Actualizado: {lastRefresh.toLocaleTimeString('es-AR')}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Usuarios */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Usuarios</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Total" value={users.total} />
            <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Últimos 7 días" value={users.last7} color="text-green-400" />
            <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Últimos 30 días" value={users.last30} />
          </div>
        </section>

        {/* Catálogo */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Catálogo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<CreditCard className="h-3.5 w-3.5" />} label="Cartas totales" value={cards.total} sub={`${cards.active} activas`} />
            <StatCard icon={<CreditCard className="h-3.5 w-3.5" />} label="Cartas esta semana" value={cards.last7} color="text-yellow-400" />
            <StatCard icon={<Package className="h-3.5 w-3.5" />} label="Sellado total" value={sealed.total} sub={`${sealed.active} activos`} />
            <StatCard icon={<Gavel className="h-3.5 w-3.5" />} label="Subastas" value={auctions.total} sub={`${auctions.active} activas · ${auctions.totalBids} ofertas`} />
          </div>
        </section>

        {/* Órdenes */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Órdenes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Total" value={orders.total} />
            <StatCard icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Pendientes" value={orders.pending} color="text-yellow-400" />
            <StatCard icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Concretadas" value={orders.completed} color="text-green-400" />
            <StatCard icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Canceladas" value={orders.cancelled} color="text-red-400" />
            <StatCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Revenue total"
              value={`$${orders.revenue.toFixed(0)}`}
              sub={`$${orders.revenue30.toFixed(0)} últimos 30d`}
              color="text-green-400"
            />
          </div>
        </section>

        {/* Comunidad */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Comunidad</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={<Heart className="h-3.5 w-3.5" />} label="Items en wishlists" value={wishlist.total} sub={`${wishlist.users} usuarios con wishlist`} />
            <StatCard icon={<span className="text-sm">🎯</span>} label="Búsquedas activas" value={wanted.total} />
          </div>
        </section>

        {/* Top vendedores + Actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top vendedores */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top vendedores (cartas)</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {topSellers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
                  <span className="text-sm font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                  <div className="flex-1 text-sm font-medium truncate">{s.name}</div>
                  <span className="text-sm font-bold text-yellow-400">{s.count}</span>
                  <span className="text-xs text-muted-foreground">cartas</span>
                </div>
              ))}
            </div>
          </section>

          {/* Actividad reciente */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Actividad reciente</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden max-h-[480px] overflow-y-auto">
              {activity.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 border-l-2 ${ACTIVITY_COLORS[a.type] ?? 'border-l-border'}`}
                >
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{ACTIVITY_ICONS[a.type] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{a.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
