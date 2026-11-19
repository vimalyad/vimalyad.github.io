import { useEffect, useMemo, useRef, useState } from 'react'
import { projects } from '../data/projects'
import { profile } from '../data/profile'
import { THEMES, useStore } from '../store'

type Cmd = { id: string; label: string; hint: string; run: () => void }

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen)
  const setPalette = useStore((s) => s.setPalette)
  const setTheme = useStore((s) => s.setTheme)
  const openProject = useStore((s) => s.openProject)
  const ref = useRef<HTMLDialogElement>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(!useStore.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalette])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setQ('')
      setSel(0)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open])

  const commands = useMemo<Cmd[]>(() => {
    const ext = (url: string) => () => window.open(url, '_blank', 'noopener')
    return [
      ...projects
        .filter((p) => p.featured)
        .map((p) => ({ id: `p-${p.slug}`, label: p.name, hint: 'project', run: () => openProject(p.slug) })),
      ...[
        ['about', 'About'],
        ['experience', 'Experience'],
        ['projects', 'Projects'],
        ['archive', 'Archive & open source'],
        ['contact', 'Contact'],
      ].map(([id, label]) => ({ id: `s-${id}`, label: `Go to ${label}`, hint: 'section', run: () => scrollToId(id) })),
      ...THEMES.map((t) => ({ id: `t-${t.id}`, label: `Switch design: ${t.label}`, hint: 'design', run: () => setTheme(t.id) })),
      { id: 'resume', label: 'Open résumé (PDF)', hint: 'link', run: ext(profile.links.resume) },
      { id: 'gh', label: 'GitHub: vimalyad', hint: 'link', run: ext(profile.links.github) },
      { id: 'gh2', label: 'GitHub: vimalkryadav', hint: 'link', run: ext(profile.links.githubAlt) },
      { id: 'li', label: 'LinkedIn', hint: 'link', run: ext(profile.links.linkedin) },
      ...projects
        .filter((p) => !p.featured)
        .map((p) => ({ id: `a-${p.slug}`, label: p.name, hint: 'archive', run: () => openProject(p.slug) })),
    ]
  }, [openProject, setTheme])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(needle))
  }, [q, commands])

  const run = (c: Cmd | undefined) => {
    if (!c) return
    setPalette(false)
    // Let the palette close (and release focus) before opening anything else.
    requestAnimationFrame(c.run)
  }

  return (
    <dialog ref={ref} className="palette" aria-label="Command palette" onClose={() => setPalette(false)} onClick={(e) => e.target === e.currentTarget && setPalette(false)}>
      <input
        autoFocus
        value={q}
        placeholder="Jump to a project, section or design…"
        aria-controls="palette-list"
        aria-activedescendant={results[sel] ? `cmd-${results[sel].id}` : undefined}
        onChange={(e) => {
          setQ(e.target.value)
          setSel(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSel((s) => Math.min(s + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSel((s) => Math.max(s - 1, 0))
          } else if (e.key === 'Enter') {
            run(results[sel])
          }
        }}
      />
      <ul id="palette-list" role="listbox">
        {results.length === 0 && <li className="empty">Nothing found.</li>}
        {results.map((c, i) => (
          <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={() => run(c)}>
            <span>{c.label}</span>
            <small>{c.hint}</small>
          </li>
        ))}
      </ul>
    </dialog>
  )
}
