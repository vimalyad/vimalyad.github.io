import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'
import { chapters } from '../data/chapters'
import { useStore } from '../store'
import { SpellView, spellInfo } from '../spells'

export function ProjectDialog() {
  const slug = useStore((s) => s.project)
  const openProject = useStore((s) => s.openProject)
  const ref = useRef<HTMLDialogElement>(null)
  const project = projects.find((p) => p.slug === slug)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (project && !d.open) d.showModal()
    if (!project && d.open) d.close()
  }, [project])

  const chapter = project && chapters.find((c) => c.category === project.category)
  const chapterName = chapter && `Chapter ${chapter.numeral} · ${chapter.grimoire}`
  const spell = project && project.spell !== 'none' ? spellInfo[project.spell] : null

  return (
    <dialog
      ref={ref}
      className="project-dialog"
      aria-labelledby="pd-title"
      onClose={() => openProject(null)}
      onClick={(e) => e.target === e.currentTarget && openProject(null)}
    >
      {project && (
        <div className="pd-inner">
          <div className="pd-head">
            <div>
              <div className="pd-kicker">{chapterName}</div>
              <h2 id="pd-title" className="pd-title">
                {project.name}
              </h2>
            </div>
            <button className="pd-close" onClick={() => openProject(null)} aria-label="Close">
              ×
            </button>
          </div>
          <p className="pd-tagline">{project.tagline}</p>
          <ul className="chips" aria-label="Stack">
            {project.stack.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
          <ul className="pd-list">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="pd-links">
            <a className="btn primary" href={project.repo} target="_blank" rel="noreferrer">
              Source on GitHub ↗
            </a>
            {project.live && (
              <a className="btn" href={project.live} target="_blank" rel="noreferrer">
                Live demo ↗
              </a>
            )}
          </div>
          {spell && (
            <section className="pd-spell" aria-label="Interactive demo">
              <h3>Spell: {spell.title}</h3>
              <p>{spell.caption}</p>
              <SpellView spell={project.spell} />
            </section>
          )}
        </div>
      )}
    </dialog>
  )
}
