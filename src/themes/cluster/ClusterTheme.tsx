import { useCallback, useEffect, useState } from 'react'
import { profile, experience, education, achievements } from '../../data/profile'
import { chapters } from '../../data/chapters'
import { featuredBy, archive, upstream } from '../../data/derived'
import { useStore } from '../../store'
import { Topology } from './Topology'
import { Terminal } from './Terminal'
import './cluster.css'

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="mono">{t.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST</span>
}

export default function ClusterTheme() {
  const openProject = useStore((s) => s.openProject)
  const [events, setEvents] = useState<{ id: number; at: string; msg: string }[]>([
    { id: 0, at: new Date().toLocaleTimeString('en-IN', { hour12: false }), msg: 'cluster vimal-prod is healthy' },
  ])
  const onEvent = useCallback((msg: string) => {
    setEvents((e) => [{ id: performance.now(), at: new Date().toLocaleTimeString('en-IN', { hour12: false }), msg }, ...e].slice(0, 7))
  }, [])

  return (
    <div className="t-cluster">
      <header className="cl-top">
        <span className="cl-brand">
          <b>⎈</b> vimal-prod
        </span>
        <nav aria-label="Sections">
          <a href="#about">node</a>
          <a href="#experience">rollouts</a>
          <a href="#projects">workloads</a>
          <a href="#archive">jobs</a>
          <a href="#contact">ingress</a>
        </nav>
        <Clock />
      </header>

      <main id="main">
        <section className="cl-hero">
          <div className="cl-intro">
            <p className="cl-kicker">$ kubectl config current-context</p>
            <h1>
              {profile.name}
              <span>{profile.role}</span>
            </h1>
            <p>{profile.tagline}</p>
            <div className="cl-actions">
              <a className="btn primary" href={profile.links.resume}>
                resume.pdf
              </a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
                github ↗
              </a>
              <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer">
                linkedin ↗
              </a>
            </div>
          </div>
          <Terminal />
        </section>

        <section className="cl-panel" aria-label="Live topology">
          <Topology onEvent={onEvent} />
          <ol className="cl-events" aria-live="polite" aria-label="Cluster events">
            {events.map((e) => (
              <li key={e.id}>
                <span>{e.at}</span> {e.msg}
              </li>
            ))}
          </ol>
        </section>

        <section id="about" className="cl-grid2">
          <div className="cl-panel">
            <h2>kubectl describe node vimal</h2>
            <dl className="cl-kv">
              <dt>Name</dt>
              <dd>{profile.name}</dd>
              <dt>Roles</dt>
              <dd>{profile.role}</dd>
              <dt>Region</dt>
              <dd>{profile.location}</dd>
              {Object.entries(profile.stack).map(([k, v]) => (
                <span key={k} style={{ display: 'contents' }}>
                  <dt>labels/{k.toLowerCase().replace(/[^a-z]+/g, '-')}</dt>
                  <dd>{v.join(', ')}</dd>
                </span>
              ))}
            </dl>
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="cl-panel">
            <h2>metrics</h2>
            <div className="cl-metrics">
              {achievements.map((a) => (
                <div key={a.label}>
                  <b>{a.value}</b>
                  <span>{a.label}</span>
                  <small>{a.detail}</small>
                </div>
              ))}
            </div>
            <h2 style={{ marginTop: '1.5rem' }}>education</h2>
            {education.map((e) => (
              <p key={e.institution}>
                <b>{e.degree}</b>, {e.institution} <span className="cl-dim">({e.period})</span>
                <br />
                <span className="cl-dim">{e.detail}</span>
              </p>
            ))}
          </div>
        </section>

        <section id="experience" className="cl-panel">
          <h2>kubectl rollout history deploy/career</h2>
          {experience.map((r, i) => (
            <article key={r.company} className="cl-rollout">
              <div className="cl-rev">rev {experience.length - i}</div>
              <div>
                <h3>
                  {r.title} <span className="cl-dim">@ {r.company}</span>
                </h3>
                <div className="cl-dim mono">
                  {r.period} · {r.location}
                </div>
                <ul>
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section id="projects">
          {chapters.map((c) => (
            <div key={c.category} className="cl-panel">
              <h2>
                kubectl get pods -n {c.cluster.replace('ns/', '')} <span className="cl-dim"># {c.blurb}</span>
              </h2>
              <div className="cl-table-wrap">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>STATUS</th>
                      <th>DESCRIPTION</th>
                      <th>IMAGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featuredBy(c.category).map((p) => (
                      <tr key={p.slug} onClick={() => openProject(p.slug)}>
                        <td>
                          <button className="cl-linkbtn" onClick={(e) => (e.stopPropagation(), openProject(p.slug))}>
                            {p.slug}
                          </button>
                        </td>
                        <td className="ok">● Running{p.spell !== 'none' ? ' · demo' : ''}</td>
                        <td>{p.tagline}</td>
                        <td className="cl-dim">{p.stack.slice(0, 3).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section id="archive" className="cl-grid2">
          <div className="cl-panel">
            <h2>upstream pull requests</h2>
            <ul className="cl-list">
              {upstream.map((u) => (
                <li key={u.url}>
                  <span className={u.state === 'merged' ? 'ok' : 'cl-open'}>{u.state.toUpperCase()}</span>
                  <a href={u.url} target="_blank" rel="noreferrer">
                    {u.project}: {u.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="cl-panel">
            <h2>kubectl get jobs --field-selector status=Complete</h2>
            <ul className="cl-list">
              {archive.map((p) => (
                <li key={p.slug}>
                  <span className="cl-dim">{p.year}</span>
                  <button className="cl-linkbtn" onClick={() => openProject(p.slug)}>
                    {p.name}
                  </button>
                  <span className="cl-dim">{p.tagline}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contact" className="cl-panel cl-contact">
          <h2>kubectl get ingress</h2>
          <pre>
            {`NAME        HOSTS\n`}
            <a href={profile.links.github}>github      github.com/vimalyad</a>
            {'\n'}
            <a href={profile.links.githubAlt}>github-alt  github.com/vimalkryadav</a>
            {'\n'}
            <a href={profile.links.linkedin}>linkedin    linkedin.com/in/vimal-kumar-yadav</a>
            {'\n'}
            <a href={profile.links.resume}>resume      vimalyadavkr.me/resume.pdf</a>
          </pre>
        </section>
      </main>
    </div>
  )
}
