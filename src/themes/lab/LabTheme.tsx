import { useState } from 'react'
import { profile, experience, education, achievements } from '../../data/profile'
import { chapters } from '../../data/chapters'
import { featuredBy, archive, upstream } from '../../data/derived'
import { projects, type Project, type Spell } from '../../data/projects'
import { SpellView, spellInfo } from '../../spells'
import { useStore } from '../../store'
import './lab.css'

const BENCH: Exclude<Spell, 'none'>[] = ['hash-ring', 'btree-wal', 'crdt', 'rate-window', 'thread-pool', 'pipeline', 'rag']
const ownerOf = (s: Spell) => projects.find((p) => p.spell === s && p.featured)

function Bench() {
  const [active, setActive] = useState<Exclude<Spell, 'none'>>('hash-ring')
  const owner = ownerOf(active)
  return (
    <div className="lab-bench">
      <div className="lab-bench-tabs" role="tablist" aria-label="Pick an experiment">
        {BENCH.filter(ownerOf).map((s) => (
          <button key={s} role="tab" aria-selected={active === s} onClick={() => setActive(s)}>
            {spellInfo[s].title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="lab-bench-body">
        <p className="lab-caption">
          <b>{owner?.name}.</b> {spellInfo[active].caption}
        </p>
        <SpellView spell={active} />
      </div>
    </div>
  )
}

function ProjectCard({ p, fig }: { p: Project; fig: string }) {
  const [open, setOpen] = useState(false)
  const openProject = useStore((s) => s.openProject)
  return (
    <article className="lab-card">
      <div className="lab-fig">Fig. {fig}</div>
      <h3>{p.name}</h3>
      <p className="lab-tag">{p.tagline}</p>
      <ul className="lab-hl">
        {p.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <ul className="chips">
        {p.stack.map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>
      <div className="lab-actions">
        {p.spell !== 'none' && (
          <button className="btn sm primary" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Hide experiment' : '▸ Run the experiment'}
          </button>
        )}
        <button className="btn sm" onClick={() => openProject(p.slug)}>
          Details
        </button>
        <a className="btn sm" href={p.repo} target="_blank" rel="noreferrer">
          Source ↗
        </a>
        {p.live && (
          <a className="btn sm" href={p.live} target="_blank" rel="noreferrer">
            Live ↗
          </a>
        )}
      </div>
      {open && (
        <div className="lab-inline">
          <SpellView spell={p.spell} />
        </div>
      )}
    </article>
  )
}

export default function LabTheme() {
  const openProject = useStore((s) => s.openProject)
  return (
    <div className="t-lab">
      <header className="lab-nav">
        <a href="#main" className="lab-logo">
          VKY<span>/lab</span>
        </a>
        <nav aria-label="Sections">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#archive">Archive</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main">
        <section className="lab-hero">
          <div>
            <p className="lab-eyebrow">
              {profile.name} · {profile.role} · {profile.location}
            </p>
            <h1>
              I rebuild the systems I depend on, <em>until I understand every byte.</em>
            </h1>
            <p className="lab-lede">{profile.tagline} Everything below is live. Poke at it.</p>
            <div className="lab-actions">
              <a className="btn primary" href="#projects">
                Browse the experiments
              </a>
              <a className="btn" href={profile.links.resume}>
                Résumé (PDF)
              </a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </div>
          </div>
          <Bench />
        </section>

        <section id="about" className="lab-section lab-two">
          <div>
            <h2>About</h2>
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div>
            <img src="/photo-480.webp" srcSet="/photo-480.webp 480w, /photo-800.webp 800w" sizes="(max-width: 800px) 90vw, 360px" width="480" height="678" alt="Portrait of Vimal Kumar Yadav" loading="lazy" decoding="async" className="lab-photo" />
            <dl className="lab-stats">
              {achievements.map((a) => (
                <div key={a.label}>
                  <dt>{a.value}</dt>
                  <dd>
                    {a.label}, {a.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="experience" className="lab-section">
          <h2>Experience</h2>
          <ol className="lab-timeline">
            {experience.map((r) => (
              <li key={r.company}>
                <div className="lab-when">{r.period}</div>
                <div>
                  <h3>
                    {r.title} <span>@ {r.company}</span>
                  </h3>
                  <ul>
                    {r.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            {education.map((e) => (
              <li key={e.institution}>
                <div className="lab-when">{e.period}</div>
                <div>
                  <h3>
                    {e.degree} <span>@ {e.institution}</span>
                  </h3>
                  <p>{e.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="projects" className="lab-section">
          <h2>Experiments</h2>
          {chapters.map((c, ci) => (
            <div key={c.category} className="lab-chapter">
              <div className="lab-chapter-head">
                <span>§{ci + 1}</span>
                <h3>{c.lab}</h3>
                <p>{c.blurb}</p>
              </div>
              <div className="lab-cards">
                {featuredBy(c.category).map((p, i) => (
                  <ProjectCard key={p.slug} p={p} fig={`${ci + 1}.${i + 1}`} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="archive" className="lab-section lab-two">
          <div>
            <h2>Upstream</h2>
            <ul className="lab-list">
              {upstream.map((c) => (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer">
                    <b>{c.project}</b> {c.title}
                  </a>
                  <span className={`lab-badge ${c.state}`}>{c.state}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Notebook</h2>
            <ul className="lab-list">
              {archive.map((p) => (
                <li key={p.slug}>
                  <button className="lab-linkbtn" onClick={() => openProject(p.slug)}>
                    <b>{p.name}</b> {p.tagline}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="lab-section lab-contact">
          <h2>Let's build something that survives a crash.</h2>
          <div className="lab-actions">
            <a className="btn primary" href={profile.links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
              github.com/vimalyad ↗
            </a>
            <a className="btn" href={profile.links.githubAlt} target="_blank" rel="noreferrer">
              github.com/vimalkryadav ↗
            </a>
            <a className="btn" href={profile.links.resume}>
              Résumé
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
