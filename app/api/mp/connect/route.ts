import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientId = process.env.MP_CLIENT_ID
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://magic.brolas.com.ar'
  const redirectUri = `${appUrl}/api/mp/callback`

  const url = new URL('https://auth.mercadopago.com/authorization')
  url.searchParams.set('client_id', clientId!)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('platform_id', 'mp')
  url.searchParams.set('state', session.user.id)
  url.searchParams.set('redirect_uri', redirectUri)

  return NextResponse.redirect(url.toString())
}
