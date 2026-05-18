import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { UpdateBanner } from '@/components/UpdateBanner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Magic Market — Comunidad',
  description: 'Marketplace de cartas Magic: The Gathering para la comunidad',
  openGraph: {
    title: 'Magic Market — Comunidad',
    description: 'Marketplace de cartas Magic: The Gathering para la comunidad',
    url: 'https://magic.brolas.com.ar',
    siteName: 'Magic Market',
    images: [{ url: 'https://magic.brolas.com.ar/logo.png', width: 512, height: 512 }],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <UpdateBanner />
          {children}
          <Toaster richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
