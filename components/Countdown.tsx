'use client'

import { useEffect, useState } from 'react'

function getTimeLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, diff }
}

export default function Countdown({
  endTime,
  onExpire,
}: {
  endTime: string
  onExpire?: () => void
}) {
  const [left, setLeft] = useState(() => getTimeLeft(endTime))

  useEffect(() => {
    const iv = setInterval(() => {
      const t = getTimeLeft(endTime)
      setLeft(t)
      if (!t) {
        clearInterval(iv)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [endTime, onExpire])

  if (!left) return <span className="text-red-400 font-semibold">Finalizada</span>

  const isUrgent = left.diff < 5 * 60 * 1000
  const cls = isUrgent ? 'text-red-400 font-bold animate-pulse' : 'text-yellow-400 font-semibold'

  const parts = []
  if (left.h > 0) parts.push(`${left.h}h`)
  parts.push(`${left.m}m`)
  parts.push(`${left.s}s`)

  return <span className={cls}>{parts.join(' ')}</span>
}
