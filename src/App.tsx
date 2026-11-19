import { Suspense, useCallback, useEffect, useState } from 'react'
import { useStore } from './store'
import { themeViews } from './themes/registry'
import { ThemeSwitcher } from './shared/ThemeSwitcher'
import { ProjectDialog } from './shared/ProjectDialog'
import { CommandPalette } from './shared/CommandPalette'
import { useKonami } from './shared/useKonami'

export default function App() {
  const theme = useStore((s) => s.theme)
  const overcharge = useStore((s) => s.overcharge)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useKonami(
    useCallback(() => {
      overcharge()
      setToast(theme === 'grimoire' ? '✦ The grimoire overflows with mana ✦' : theme === 'cluster' ? 'chaos-mode: ENABLED' : 'Secret found. Hello, fellow tinkerer.')
      setTimeout(() => setToast(null), 3500)
    }, [overcharge, theme]),
  )

  const View = themeViews[theme]
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Suspense fallback={<div className="boot" aria-busy="true" />}>
        <View key={theme} />
      </Suspense>
      <ThemeSwitcher />
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
