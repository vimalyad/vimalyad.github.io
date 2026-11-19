import { useEffect, useRef, useState } from 'react'
import { profile, experience, education, achievements } from '../../data/profile'
import { projects } from '../../data/projects'
import { chapters } from '../../data/chapters'
import { upstream } from '../../data/derived'
import { THEMES, useStore, type ThemeId } from '../../store'

type Line = { text: string; kind?: 'cmd' | 'err' | 'ok' | 'dim' }

const nsName = (c: string) => chapters.find((x) => x.category === c)!.cluster.replace('ns/', '')
const pad = (s: string, n: number) => (s.length > n - 1 ? s.slice(0, n - 2) + '… ' : s.padEnd(n))

const COMMANDS = ['help', 'whoami', 'neofetch', 'ls', 'cat', 'kubectl', 'open', 'experience', 'education', 'upstream', 'contact', 'resume', 'theme', 'chaos', 'clear', 'sudo', 'echo']
const KUBECTL = ['get pods', 'get pods -A', 'get ns', 'describe pod', 'rollout history deploy/career', 'logs']

const HELP = `available commands
  whoami                      who is this
  neofetch                    system summary
  ls / cat about.txt          browse files
  kubectl get ns              list namespaces (project categories)
  kubectl get pods [-n ns]    list projects     (-A for everything)
  kubectl describe pod <name> project details
  open <name>                 open a project's interactive view
  kubectl rollout history deploy/career   experience
  experience | education | upstream | contact | resume
  theme <grimoire|lab|cluster|resume>     switch design
  chaos                       release the chaos monkey
  clear                       clear the screen
tips: Tab completes, ↑/↓ walks history.`

function podsTable(filter?: string, all = false): string {
  const rows = projects.filter((p) => (all || p.featured) && (!filter || nsName(p.category) === filter))
  if (!rows.length) return `No resources found in ${filter} namespace.`
  const head = (all || !filter ? pad('NAMESPACE', 11) : '') + pad('NAME', 28) + pad('STATUS', 11) + pad('AGE', 6) + 'IMAGE'
  return [
    head,
    ...rows.map(
      (p) =>
        (all || !filter ? pad(nsName(p.category), 11) : '') +
        pad(p.slug, 28) +
        pad(p.featured ? 'Running' : 'Completed', 11) +
        pad(String(p.year), 6) +
        p.stack.slice(0, 2).join('+').toLowerCase().replace(/\s/g, ''),
    ),
  ].join('\n')
}

export function Terminal() {
  const setTheme = useStore((s) => s.setTheme)
  const openProject = useStore((s) => s.openProject)
  const [lines, setLines] = useState<Line[]>([
    { text: `Last login: ${new Date().toDateString()} from recruiter-laptop`, kind: 'dim' },
    { text: "Type 'help' to get started, or try: kubectl get pods", kind: 'ok' },
  ])
  const [input, setInput] = useState('')
  const [hist, setHist] = useState<string[]>([])
  const [hi, setHi] = useState(-1)
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines])

  // Greet with a neofetch so the terminal isn't an empty box on first paint.
  useEffect(() => {
    setLines((l) => [...l.slice(0, 1), { text: '$ neofetch', kind: 'cmd' }, ...(exec('neofetch') as Line[]), l[1]])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const findProject = (q: string) => projects.find((p) => p.slug === q) ?? projects.find((p) => p.slug.startsWith(q) || p.name.toLowerCase() === q.toLowerCase())

  const exec = (raw: string): Line[] | 'clear' => {
    const cmd = raw.trim()
    const [c, ...args] = cmd.split(/\s+/)
    const a = args.join(' ')
    switch (c) {
      case '':
        return []
      case 'help':
        return [{ text: HELP }]
      case 'whoami':
        return [{ text: `${profile.name}\n${profile.role} · ${profile.location}\n${profile.tagline}` }]
      case 'neofetch':
        return [
          { text: '    ▲\n   ▲ ▲\n  ▲▲▲▲▲   vimal@vimal-prod', kind: 'ok' },
          {
            text: [
              `OS           ${profile.role}`,
              `Host         ${profile.location}`,
              `Kernel       Java · Rust · Go · TypeScript`,
              `Uptime       ${experience.length} roles, ${projects.length} repos showcased`,
              `Packages     ${upstream.length} upstream PRs (${upstream.filter((u) => u.state === 'merged').length} merged)`,
              `Shell        ${Object.values(profile.stack).flat().slice(0, 6).join(', ')}`,
              `Achievement  ${achievements[0].value}, ${achievements[0].label}`,
            ].join('\n'),
          },
        ]
      case 'ls':
        return [{ text: 'about.txt  experience.log  education.txt  projects/  upstream.txt  resume.pdf' }]
      case 'cat':
        if (a === 'about.txt') return profile.about.map((t) => ({ text: t }))
        if (a === 'experience.log') return exec('experience') as Line[]
        if (a === 'education.txt') return exec('education') as Line[]
        if (a === 'upstream.txt') return exec('upstream') as Line[]
        if (a === 'resume.pdf') return [{ text: 'binary file; try `resume` instead', kind: 'err' }]
        return [{ text: `cat: ${a || '(missing operand)'}: No such file`, kind: 'err' }]
      case 'kubectl': {
        if (args[0] === 'get' && args[1] === 'ns')
          return [{ text: ['NAME          STATUS   PODS', ...chapters.map((ch) => pad(nsName(ch.category), 14) + pad('Active', 9) + projects.filter((p) => p.category === ch.category && p.featured).length)].join('\n') }]
        if (args[0] === 'get' && args[1]?.startsWith('pod')) {
          const n = args.indexOf('-n')
          return [{ text: podsTable(n > -1 ? args[n + 1] : undefined, args.includes('-A')) }]
        }
        if (args[0] === 'describe' && args[1]?.startsWith('pod')) {
          const p = args[2] && findProject(args[2])
          if (!p) return [{ text: `Error from server (NotFound): pods "${args[2] ?? ''}" not found`, kind: 'err' }]
          return [
            {
              text: `Name:        ${p.slug}\nNamespace:   ${nsName(p.category)}\nImage:       ${p.stack.join(', ')}\nDescription: ${p.tagline}\nEvents:\n${p.highlights.map((h) => `  Normal  ${h}`).join('\n')}\nSource:      ${p.repo}${p.live ? `\nLive:        ${p.live}` : ''}`,
            },
            { text: `→ run 'open ${p.slug}' for the interactive view`, kind: 'ok' },
          ]
        }
        if (args[0] === 'rollout') return exec('experience') as Line[]
        if (args[0] === 'logs') return [{ text: 'no logs: this pod writes everything to GitHub', kind: 'dim' }]
        return [{ text: `kubectl: try one of: ${KUBECTL.join(' | ')}`, kind: 'err' }]
      }
      case 'open': {
        const p = findProject(a)
        if (!p) return [{ text: `open: no project matching '${a}'. Try kubectl get pods -A`, kind: 'err' }]
        setTimeout(() => openProject(p.slug), 150)
        return [{ text: `opening ${p.name}…`, kind: 'ok' }]
      }
      case 'experience':
        return [
          {
            text: [
              'REVISION  PERIOD                 CHANGE-CAUSE',
              ...experience.map((r, i) => `${pad(String(experience.length - i), 10)}${pad(r.period, 23)}${r.title} @ ${r.company}\n${r.points.map((p) => `          · ${p}`).join('\n')}`),
            ].join('\n'),
          },
        ]
      case 'education':
        return [{ text: education.map((e) => `${pad(e.period, 13)}${e.degree}, ${e.institution}\n             ${e.detail}`).join('\n') }]
      case 'upstream':
        return [{ text: upstream.map((u) => `${pad(u.state.toUpperCase(), 8)}${pad(u.project, 22)}${u.title}`).join('\n') }]
      case 'contact':
        return [{ text: `github    ${profile.links.github}\ngithub    ${profile.links.githubAlt}\nlinkedin  ${profile.links.linkedin}` }]
      case 'resume':
        window.open(profile.links.resume, '_blank', 'noopener')
        return [{ text: 'opening resume.pdf…', kind: 'ok' }]
      case 'theme':
        if (THEMES.some((t) => t.id === a)) {
          setTimeout(() => setTheme(a as ThemeId), 300)
          return [{ text: `switching context to ${a}…`, kind: 'ok' }]
        }
        return [{ text: `usage: theme <${THEMES.map((t) => t.id).join('|')}>`, kind: 'err' }]
      case 'chaos':
        window.dispatchEvent(new Event('chaos'))
        return [{ text: 'chaos-monkey released. Watch the topology.', kind: 'ok' }]
      case 'sudo':
        if (!a.includes('hire')) return [{ text: 'visitor is not in the sudoers file. This incident will be reported.', kind: 'err' }]
        window.open(profile.links.linkedin, '_blank', 'noopener')
        return [{ text: '[sudo] permission granted. Opening LinkedIn…', kind: 'ok' }]
      case 'echo':
        return [{ text: a }]
      case 'clear':
        return 'clear'
      default:
        return [{ text: `${c}: command not found. Type 'help'.`, kind: 'err' }]
    }
  }

  const submit = () => {
    const out = exec(input)
    if (out === 'clear') setLines([])
    else setLines((l) => [...l, { text: `$ ${input}`, kind: 'cmd' as const }, ...out].slice(-300))
    if (input.trim()) setHist((h) => [...h, input])
    setHi(-1)
    setInput('')
  }

  const complete = () => {
    const parts = input.split(' ')
    const last = parts[parts.length - 1]
    let pool: string[]
    if (parts.length === 1) pool = COMMANDS
    else if (parts[0] === 'kubectl' && parts.length === 2) pool = ['get', 'describe', 'rollout', 'logs']
    else if (parts[0] === 'theme') pool = THEMES.map((t) => t.id)
    else if (parts[0] === 'cat') pool = ['about.txt', 'experience.log', 'education.txt', 'upstream.txt']
    else if (parts.includes('-n')) pool = chapters.map((c) => nsName(c.category))
    else pool = projects.map((p) => p.slug).concat(['pods', 'pod', 'ns'])
    const hits = pool.filter((x) => x.startsWith(last))
    if (hits.length === 1) setInput([...parts.slice(0, -1), hits[0]].join(' ') + ' ')
    else if (hits.length > 1) setLines((l) => [...l, { text: hits.join('  '), kind: 'dim' }])
  }

  return (
    <div className="cl-term" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="cl-term-bar">
        <span className="cl-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>visitor@vimal-prod: ~</span>
      </div>
      <div className="cl-term-body" ref={scroller} aria-live="polite">
        {lines.map((l, i) => (
          <pre key={i} className={l.kind}>
            {l.text}
          </pre>
        ))}
        <div className="cl-prompt">
          <label htmlFor="cl-input">$</label>
          <input
            id="cl-input"
            ref={inputRef}
            value={input}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Terminal command"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              else if (e.key === 'Tab') {
                e.preventDefault()
                complete()
              } else if (e.key === 'ArrowUp' && hist.length) {
                e.preventDefault()
                const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1)
                setHi(n)
                setInput(hist[n])
              } else if (e.key === 'ArrowDown' && hi >= 0) {
                e.preventDefault()
                const n = hi + 1
                setHi(n >= hist.length ? -1 : n)
                setInput(n >= hist.length ? '' : hist[n])
              } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault()
                setLines([])
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
