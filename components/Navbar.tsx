'use client'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package, LogOut, User } from 'lucide-react'
import Image from 'next/image'
import { ProfileDialog } from '@/components/ProfileDialog'
import * as React from 'react'

interface NavbarProps {
  cartCount: number
}

export function Navbar({ cartCount }: NavbarProps) {
  const { data: session, status } = useSession()
  const [profileOpen, setProfileOpen] = React.useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Magic Market" width={40} height={40} className="object-contain" />
            <span className="font-bold text-lg hidden sm:inline">Magic Market</span>
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

                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setProfileOpen(true)}
                  >
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline text-sm">
                      {session.user?.name?.split(' ')[0]}
                    </span>
                  </Button>
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

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
