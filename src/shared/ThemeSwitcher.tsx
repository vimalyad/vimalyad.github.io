import { THEMES, useStore } from '../store'
import { prefetch } from "../themes/registry"

export function ThemeSwitcher() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const setPalette = useStore((s) => s.setPalette)
  return (
    <nav className="switcher" aria-label="Choose a design">
      {THEMES.map((t) => (
        <button key={t.id} aria-pressed={theme === t.id} title={t.hint} onClick={() => setTheme(t.id)} onPointerEnter={() => prefetch(t.id)} onFocus={() => prefetch(t.id)}>
          {t.label}
        </button>
      ))}
      <button className="palette-btn" onClick={() => setPalette(true)} aria-label="Open command palette">
        <span>Search</span>
        <span className="kbd">⌘K</span>
      </button>
    </nav>
  )
}
