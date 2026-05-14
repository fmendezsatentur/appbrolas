'use client'

import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutos

export function UpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const initialVersion = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version')
        if (!res.ok) return
        const { version } = await res.json()
        if (initialVersion.current === null) {
          initialVersion.current = version
        } else if (version !== initialVersion.current) {
          setHasUpdate(true)
        }
      } catch {
        // silencioso — no romper la app si el endpoint falla
      }
    }

    check()
    const interval = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  if (!hasUpdate) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 bg-primary px-4 py-2.5 text-primary-foreground text-sm shadow-lg">
      <span className="font-medium">
        Hay una nueva versión disponible ✨
      </span>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 rounded bg-white/20 px-3 py-1 font-semibold hover:bg-white/30 active:scale-95 transition-all"
      >
        Actualizar ahora
      </button>
    </div>
  )
}
