import { lazy, type ComponentType } from 'react'
import type { ThemeId } from '../store'

// Each design is its own chunk: visitors only download the 3D engine if they pick the Grimoire.
export const loaders: Record<ThemeId, () => Promise<{ default: ComponentType }>> = {
  grimoire: () => import('./grimoire/GrimoireTheme'),
  lab: () => import('./lab/LabTheme'),
  cluster: () => import('./cluster/ClusterTheme'),
  resume: () => import('./resume/ResumeTheme'),
}

export const themeViews = Object.fromEntries(Object.entries(loaders).map(([k, load]) => [k, lazy(load)])) as Record<
  ThemeId,
  ReturnType<typeof lazy>
>

/** Warm a design's chunk before the click (hover/focus on the switcher). */
export const prefetch = (id: ThemeId) => void loaders[id]().catch(() => {})
