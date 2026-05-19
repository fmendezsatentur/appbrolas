import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://magic.brolas.com.ar'
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/mis-cartas?mp=error`)
  }

  try {
    const res = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/api/mp/callback`,
      }),
    })

    if (!res.ok) {
      console.error('MP token error:', await res.text())
      return NextResponse.redirect(`${appUrl}/mis-cartas?mp=error`)
    }

    const data = await res.json()

    await prisma.user.update({
      where: { id: userId },
      data: {
        mpAccessToken: data.access_token,
        mpRefreshToken: data.refresh_token ?? null,
        mpUserId: String(data.user_id),
      },
    })

    return NextResponse.redirect(`${appUrl}/mis-cartas?mp=connected`)
  } catch (e) {
    console.error('MP callback error:', e)
    return NextResponse.redirect(`${appUrl}/mis-cartas?mp=error`)
  }
}
