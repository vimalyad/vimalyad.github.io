import { useRef, useState } from 'react'
import { sleep } from './useTick'

type Status = 'idle' | 'run' | 'pass' | 'fail'
const STAGES = [
  { id: 'test', label: 'build + tests', breaks: 'test' },
  { id: 'semgrep', label: 'semgrep (SAST)', breaks: null },
  { id: 'gitleaks', label: 'gitleaks', breaks: 'secret' },
  { id: 'trivy', label: 'trivy image scan', breaks: 'cve' },
  { id: 'ghcr', label: 'push → GHCR', breaks: null },
  { id: 'argo', label: 'Argo CD sync', breaks: null },
] as const
type Sabotage = 'test' | 'secret' | 'cve'
const SABOTAGE: { id: Sabotage; label: string; why: string }[] = [
  { id: 'test', label: 'failing test', why: 'a unit test failed' },
  { id: 'secret', label: 'commit an API key', why: 'gitleaks found a hard-coded secret' },
  { id: 'cve', label: 'vulnerable base image', why: 'trivy found a CRITICAL CVE in the image' },
]

export default function Pipeline() {
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [sabotage, setSabotage] = useState<Set<Sabotage>>(new Set())
  const [pods, setPods] = useState<string[]>(['v1', 'v1', 'v1'])
  const [version, setVersion] = useState(1)
  const [note, setNote] = useState('Push a commit. Optionally sabotage it first.')
  const [busy, setBusy] = useState(false)
  const gen = useRef(0)

  const push = async () => {
    const g = ++gen.current
    setBusy(true)
    setStatus({})
    const target = `v${version + 1}`
    for (const st of STAGES) {
      setStatus((s) => ({ ...s, [st.id]: 'run' }))
      setNote(`Running ${st.label}…`)
      await sleep(550)
      if (g !== gen.current) return
      if (st.breaks && sabotage.has(st.breaks as Sabotage)) {
        setStatus((s) => ({ ...s, [st.id]: 'fail' }))
        setNote(`✗ Blocked: ${SABOTAGE.find((x) => x.id === st.breaks)!.why}. Nothing reaches the cluster.`)
        setBusy(false)
        return
      }
      setStatus((s) => ({ ...s, [st.id]: 'pass' }))
    }
    // Rolling update: replace one pod at a time, so capacity never drops.
    setNote(`Helm chart synced; rolling ${target} out one pod at a time.`)
    for (let i = 0; i < 3; i++) {
      await sleep(500)
      if (g !== gen.current) return
      setPods((p) => p.map((x, j) => (j === i ? target : x)))
    }
    setVersion((v) => v + 1)
    setNote(`✓ ${target} is live on all replicas.`)
    setBusy(false)
  }

  const drift = async () => {
    const g = ++gen.current
    setBusy(true)
    setPods((p) => [...p, 'manual', 'manual'])
    setNote('Someone ran `kubectl scale --replicas=5` by hand. The live state no longer matches Git: OutOfSync.')
    await sleep(1500)
    if (g !== gen.current) return
    setPods((p) => p.filter((x) => x !== 'manual'))
    setNote('Argo CD self-heal reverted the manual change. Git stays the source of truth.')
    setBusy(false)
  }

  return (
    <div className="spell">
      <div className="spell-controls">
        <button className="btn sm primary" onClick={push} disabled={busy}>
          git push
        </button>
        <button className="btn sm" onClick={drift} disabled={busy}>
          kubectl edit (drift)
        </button>
        {SABOTAGE.map((s) => (
          <label key={s.id}>
            <input
              type="checkbox"
              checked={sabotage.has(s.id)}
              onChange={(e) =>
                setSabotage((cur) => {
                  const n = new Set(cur)
                  if (e.target.checked) n.add(s.id)
                  else n.delete(s.id)
                  return n
                })
              }
            />
            {s.label}
          </label>
        ))}
      </div>
      <div className="stages" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <span key={s.id} style={{ display: 'contents' }}>
            {i > 0 && <span aria-hidden>→</span>}
            <span className={`stage ${status[s.id] ?? ''}`}>
              {status[s.id] === 'pass' ? '✓ ' : status[s.id] === 'fail' ? '✗ ' : ''}
              {s.label}
            </span>
          </span>
        ))}
      </div>
      <div className="spell-box" style={{ marginTop: '0.8rem' }}>
        <h4>Deployment · {pods.length} replicas</h4>
        <div className="cells" style={{ gap: 8 }}>
          {pods.map((p, i) => (
            <span key={i} className="stage" style={p === 'manual' ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : { borderColor: 'var(--ok)', color: 'var(--ok)' }}>
              pod-{i + 1} {p}
            </span>
          ))}
        </div>
      </div>
      <div className="spell-note" aria-live="polite">
        {note}
      </div>
    </div>
  )
}
