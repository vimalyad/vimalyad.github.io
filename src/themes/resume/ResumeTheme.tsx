import { profile, experience, education, achievements } from '../../data/profile'
import { chapters } from '../../data/chapters'
import { featuredBy, archive, upstream } from '../../data/derived'
import { useStore } from '../../store'
import './resume.css'

export default function ResumeTheme() {
  const openProject = useStore((s) => s.openProject)
  return (
    <main id="main" className="t-resume">
      <header>
        <h1>{profile.name}</h1>
        <p className="r-role">
          {profile.role} · {profile.location}
        </p>
        <p className="r-links">
          <a href={profile.links.github}>github.com/vimalyad</a> · <a href={profile.links.githubAlt}>github.com/vimalkryadav</a> ·{' '}
          <a href={profile.links.linkedin}>LinkedIn</a> · <a href={profile.links.resume}>PDF résumé</a>
          <button className="btn sm no-print" onClick={() => window.print()}>
            Print
          </button>
        </p>
      </header>

      <section id="about" aria-labelledby="r-about">
        <h2 id="r-about">Summary</h2>
        {profile.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section id="experience" aria-labelledby="r-exp">
        <h2 id="r-exp">Experience</h2>
        {experience.map((r) => (
          <article key={r.company}>
            <div className="r-row">
              <h3>
                {r.title}, {r.company}
              </h3>
              <span>
                {r.period} · {r.location}
              </span>
            </div>
            <ul>
              {r.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section id="projects" aria-labelledby="r-proj">
        <h2 id="r-proj">Selected projects</h2>
        {chapters.map((c) => (
          <div key={c.category}>
            <h3 className="r-cat">{c.lab}</h3>
            {featuredBy(c.category).map((p) => (
              <article key={p.slug} className="r-project">
                <div className="r-row">
                  <h4>
                    <button className="r-link" onClick={() => openProject(p.slug)}>
                      {p.name}
                    </button>
                  </h4>
                  <span>{p.stack.join(' · ')}</span>
                </div>
                <p>{p.tagline}</p>
                <ul>
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ))}
      </section>

      <section id="archive" aria-labelledby="r-oss">
        <h2 id="r-oss">Open source</h2>
        <ul>
          {upstream.map((c) => (
            <li key={c.url}>
              <a href={c.url}>{c.project}</a>: {c.title} <em>({c.state})</em>
            </li>
          ))}
        </ul>
        <h2>Other work</h2>
        <ul className="r-archive">
          {archive.map((p) => (
            <li key={p.slug}>
              <a href={p.repo}>{p.name}</a>: {p.tagline}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="r-edu">
        <h2 id="r-edu">Education & achievements</h2>
        {education.map((e) => (
          <div key={e.institution} className="r-row">
            <span>
              <b>{e.degree}</b>, {e.institution}: {e.detail}
            </span>
            <span>{e.period}</span>
          </div>
        ))}
        <ul>
          {achievements.map((a) => (
            <li key={a.label}>
              <b>{a.value}</b>, {a.label} ({a.detail})
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" aria-labelledby="r-skills">
        <h2 id="r-skills">Skills</h2>
        {Object.entries(profile.stack).map(([k, v]) => (
          <p key={k}>
            <b>{k}:</b> {v.join(', ')}
          </p>
        ))}
      </section>
    </main>
  )
}
