import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { profile, experience, education, achievements } from '../../data/profile'
import { chapters } from '../../data/chapters'
import { featuredBy, archive, upstream } from '../../data/derived'
import { useStore, canRun3D } from '../../store'
import { useFloorTracking } from './scroll'
import type { FloorDef } from './Scene'
import './grimoire.css'

// three.js + R3F live in their own chunk, fetched in parallel with the fonts the textures need.
const Scene = lazy(() => import('./Scene'))

function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const fonts = document.fonts as FontFaceSet | undefined
    Promise.all(fonts ? [fonts.load('700 50px Cinzel'), fonts.load('600 22px Cinzel')] : [])
      .catch(() => {})
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}

export default function GrimoireTheme() {
  const openProject = useStore((s) => s.openProject)
  const active = useFloorTracking()
  const fontsReady = useFontsReady()
  const [sceneReady, setSceneReady] = useState(false)
  const webgl = useMemo(canRun3D, [])

  const floors = useMemo<FloorDef[]>(
    () => [
      { kind: 'hero', color: '#e8b55a', label: 'Prologue' },
      { kind: 'origin', color: '#5eead4', label: 'Origin', words: Object.values(profile.stack).flat().slice(0, 14) },
      ...chapters.map<FloorDef>((c) => ({ kind: 'chapter', color: c.color, label: `Chapter ${c.numeral}`, projects: featuredBy(c.category) })),
      { kind: 'archive', color: '#c4b5fd', label: 'Archive', projects: archive },
      { kind: 'summon', color: '#f3c977', label: 'Summon' },
    ],
    [],
  )
  const gauge = ['Prologue', 'Origin', ...chapters.map((c) => `Chapter ${c.numeral}`), 'Archive', 'Summon']

  return (
    <div className="t-grimoire">
      <div className="g-stage" aria-hidden>
        {webgl && fontsReady && (
          <Suspense fallback={null}>
            <Scene floors={floors} onReady={() => setSceneReady(true)} />
          </Suspense>
        )}
        {!webgl && <div className="g-static" />}
        <div className={`g-loader ${sceneReady || !webgl ? 'done' : ''}`}>
          <div className="g-loader-ring" />
          <p>Unsealing the grimoire…</p>
        </div>
      </div>

      <nav className="g-gauge" aria-label="Floors">
        {gauge.map((g, i) => (
          <button
            key={g}
            aria-current={active === i ? 'location' : undefined}
            onClick={() => document.querySelector(`[data-floor="${i}"]`)?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>{g}</span>
          </button>
        ))}
      </nav>

      <main id="main" className="g-main">
        <section data-floor="0" className="g-section g-hero">
          <div className="g-panel g-panel-hero">
            <p className="g-kicker">The Grimoire of</p>
            <h1>{profile.name}</h1>
            <p className="g-role">
              {profile.role} · {profile.location}
            </p>
            <p>{profile.tagline}</p>
            <div className="g-actions">
              <a className="btn primary" href="#about">
                Begin the descent ↓
              </a>
              <a className="btn" href={profile.links.resume}>
                Résumé
              </a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </div>
            <p className="g-hint">Touch a floating tome to open it · press ⌘K to search the archive</p>
          </div>
        </section>

        <section data-floor="1" id="about" className="g-section">
          <div className="g-panel">
            <p className="g-kicker">Origin</p>
            <h2>The Apprentice</h2>
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className="g-stats">
              {achievements.map((a) => (
                <div key={a.label}>
                  <b>{a.value}</b>
                  <span>
                    {a.label}, {a.detail}
                  </span>
                </div>
              ))}
            </div>
            <h3 id="experience" className="g-sub">
              Quests undertaken
            </h3>
            {experience.map((r) => (
              <article key={r.company} className="g-quest">
                <div className="g-quest-head">
                  <div>
                    <b>{r.title}</b> · {r.company}
                  </div>
                  <span>{r.period}</span>
                </div>
                <ul>
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
            <h3 className="g-sub">Training grounds</h3>
            {education.map((e) => (
              <p key={e.institution} className="g-edu">
                <b>{e.degree}</b>, {e.institution} <span>({e.period})</span>
              </p>
            ))}
          </div>
        </section>

        <div id="projects">
          {chapters.map((c, i) => (
            <section key={c.category} data-floor={i + 2} className="g-section" style={{ ['--chapter' as string]: c.color }}>
              <div className="g-panel">
                <p className="g-kicker">Chapter {c.numeral}</p>
                <h2>{c.grimoire}</h2>
                <p className="g-blurb">{c.blurb}</p>
                <ul className="g-tomes">
                  {featuredBy(c.category).map((p) => (
                    <li key={p.slug}>
                      <button onClick={() => openProject(p.slug)}>
                        <span className="g-tome-name">{p.name}</span>
                        <span className="g-tome-tag">{p.tagline}</span>
                        <span className="g-tome-meta">
                          {p.stack.slice(0, 4).join(' · ')}
                          {p.spell !== 'none' && <em> ✦ contains a spell</em>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section data-floor={chapters.length + 2} id="archive" className="g-section">
          <div className="g-panel">
            <p className="g-kicker">The Archive</p>
            <h2>Lesser tomes & offerings</h2>
            <h3 className="g-sub">Offerings to other libraries (upstream PRs)</h3>
            <ul className="g-plain">
              {upstream.map((u) => (
                <li key={u.url}>
                  <a href={u.url} target="_blank" rel="noreferrer">
                    {u.project}
                  </a>
                  : {u.title} <span className={`g-state ${u.state}`}>{u.state}</span>
                </li>
              ))}
            </ul>
            <h3 className="g-sub">Shelved tomes</h3>
            <ul className="g-plain g-cols">
              {archive.map((p) => (
                <li key={p.slug}>
                  <button className="g-linkbtn" onClick={() => openProject(p.slug)}>
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section data-floor={chapters.length + 3} id="contact" className="g-section">
          <div className="g-panel">
            <p className="g-kicker">Summon</p>
            <h2>Call upon the engineer</h2>
            <p>Need a backend that survives the crash, the stampede and the 3 a.m. page? The circle is open.</p>
            <div className="g-actions">
              <a className="btn primary" href={profile.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
                github/vimalyad ↗
              </a>
              <a className="btn" href={profile.links.githubAlt} target="_blank" rel="noreferrer">
                github/vimalkryadav ↗
              </a>
              <a className="btn" href={profile.links.resume}>
                Résumé
              </a>
            </div>
            <p className="g-hint">Psst: the summoning circle reacts to touch. So does a certain old cheat code.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
