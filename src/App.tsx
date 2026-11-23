import { useCallback, useState } from 'react'
import { useStore } from './store'
import GrimoireTheme from './themes/grimoire/GrimoireTheme'
import { ProjectDialog } from './shared/ProjectDialog'
import { CommandPalette } from './shared/CommandPalette'
import { useKonami } from './shared/useKonami'

export default function App() {
  const overcharge = useStore((s) => s.overcharge)
  const setPalette = useStore((s) => s.setPalette)
  const [toast, setToast] = useState<string | null>(null)

  useKonami(
    useCallback(() => {
      overcharge()
      setToast('✦ The grimoire overflows with mana ✦')
      setTimeout(() => setToast(null), 3500)
    }, [overcharge]),
  )

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <GrimoireTheme />
      <button className="search-fab" onClick={() => setPalette(true)} aria-label="Search projects and sections">
        <span>Search</span>
        <span className="kbd">⌘K</span>
      </button>
      <ProjectDialog />
      <CommandPalette />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
