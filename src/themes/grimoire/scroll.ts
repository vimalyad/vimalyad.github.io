import { useEffect, useState } from 'react'

/**
 * Continuous "which floor are we on" derived from native scroll, so the DOM stays the
 * source of truth (real scrolling, real links, screen readers) and the 3D camera just follows.
 * floor = i exactly when section i's middle is at the viewport middle; interpolated between.
 */
export const floorState = { floor: 0, count: 1 }

function measure() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-floor]'))
  floorState.count = els.length
  if (!els.length) return
  const c = window.scrollY + window.innerHeight / 2
  const mids = els.map((el) => {
    const r = el.getBoundingClientRect()
    // Tall sections: treat their "middle" as the point where their top half is in view.
    return window.scrollY + r.top + Math.min(r.height, window.innerHeight) / 2
  })
  if (c <= mids[0]) return (floorState.floor = 0)
  for (let i = 0; i < mids.length - 1; i++) {
    if (c < mids[i + 1]) {
      // Hold on a floor while its section is on screen, then glide to the next one.
      const t = (c - mids[i]) / (mids[i + 1] - mids[i])
      const eased = Math.min(1, Math.max(0, (t - 0.25) / 0.6))
      return (floorState.floor = i + eased * eased * (3 - 2 * eased))
    }
  }
  floorState.floor = mids.length - 1
}

/** Keeps floorState fresh and returns the nearest whole floor for React UI (only re-renders on change). */
export function useFloorTracking() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        measure()
        setActive(Math.round(floorState.floor))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return active
}
