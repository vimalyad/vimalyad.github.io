import { useEffect, useState } from 'react'

/** Re-render every `ms` while `active`; pauses automatically when the tab is hidden (setInterval throttling). */
export function useTick(ms: number, active = true) {
  const [, set] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(id)
  }, [ms, active])
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 32-bit FNV-1a; deterministic, good enough spread for visualisations. */
export function fnv1a(s: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // murmur3 finaliser: FNV alone barely mixes the last characters, so `user:1`..`user:40` would clump on the ring.
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
