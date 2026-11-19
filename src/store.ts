import { create } from 'zustand'

export type ThemeId = 'grimoire' | 'lab' | 'cluster' | 'resume'

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: 'grimoire', label: 'Grimoire', hint: '3D arcane library' },
  { id: 'lab', label: 'Systems Lab', hint: 'Live simulations' },
  { id: 'cluster', label: 'Cluster', hint: 'Command center' },
  { id: 'resume', label: 'Résumé', hint: 'Plain & printable' },
]

const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v)

export function canRun3D(): boolean {
  try {
    const mm = (q: string) => window.matchMedia(q).matches
    if (mm('(prefers-reduced-motion: reduce)')) return false
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    if (nav.connection?.saveData) return false
    if ((nav.deviceMemory ?? 8) < 4) return false
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function initialTheme(): ThemeId {
  const q = new URLSearchParams(location.search).get('theme')
  if (isTheme(q)) return q
  const saved = localStorage.getItem('theme')
  if (isTheme(saved)) {
    // A saved 3D preference still falls back if this device can't run it.
    return saved === 'grimoire' && !canRun3D() ? 'lab' : saved
  }
  return canRun3D() ? 'grimoire' : 'lab'
}

type State = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  project: string | null
  openProject: (slug: string | null) => void
  paletteOpen: boolean
  setPalette: (open: boolean) => void
  overcharged: boolean
  overcharge: () => void
}

export const useStore = create<State>((set) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    const url = new URL(location.href)
    url.searchParams.set('theme', theme)
    history.replaceState(null, '', url)
    window.scrollTo({ top: 0 })
    set({ theme })
  },
  project: null,
  openProject: (project) => set({ project }),
  paletteOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),
  overcharged: false,
  overcharge: () => {
    set({ overcharged: true })
    setTimeout(() => set({ overcharged: false }), 6000)
  },
}))
