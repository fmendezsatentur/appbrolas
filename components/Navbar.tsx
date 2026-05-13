'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package, LogOut, Sparkles } from 'lucide-react'

interface NavbarProps {
  cartCount: number
}

export function Navbar({ cartCount }: NavbarProps) {
  const { data: session, status } = useSession()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Magic Market
        </Link>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && (
            <>
              <Link href="/mis-cartas">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Mis cartas</span>
                </Button>
              </Link>

              <Link href="/carrito">
                <Button variant="ghost" size="sm" className="gap-2 relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                  <span className="hidden sm:inline">Carrito</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ''}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <span className="text-sm hidden sm:inline text-muted-foreground">
                  {session.user?.name?.split(' ')[0]}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {status === 'unauthenticated' && (
            <Button size="sm" onClick={() => signIn('google')}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
