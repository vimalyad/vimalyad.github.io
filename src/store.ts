import { create } from 'zustand'

/** Whether this device should get the live 3D scene (otherwise: same content over a static backdrop). */
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

type State = {
  project: string | null
  openProject: (slug: string | null) => void
  paletteOpen: boolean
  setPalette: (open: boolean) => void
  overcharged: boolean
  overcharge: () => void
}

export const useStore = create<State>((set) => ({
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
