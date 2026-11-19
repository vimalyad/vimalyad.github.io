import { useRef, useState } from 'react'
import { useTick } from './useTick'

const LIMIT = 5
const WINDOW = 3000
const SPAN = 9000 // timeline width in ms

type Algo = 'fixed' | 'sliding'
type Req = { t: number; ok: boolean }

export default function RateWindow() {
  const [algo, setAlgo] = useState<Algo>('fixed')
  const reqs = useRef<Req[]>([])
  const [peak, setPeak] = useState(0)
  const [, force] = useState(0)
  useTick(80)

  const accepted = (from: number, to: number) => reqs.current.filter((r) => r.ok && r.t > from && r.t <= to).length

  const request = () => {
    const now = performance.now()
    const used =
      algo === 'fixed'
        ? accepted(Math.floor(now / WINDOW) * WINDOW - 0.001, now) // count since the current window started
        : accepted(now - WINDOW, now) // exact log of the trailing window
    const ok = used < LIMIT
    reqs.current = [...reqs.current.filter((r) => r.t > now - SPAN), { t: now, ok }]
    // Worst case actually admitted in any trailing 3 s span: the number the limit is supposed to guarantee.
    if (ok) setPeak((p) => Math.max(p, accepted(now - WINDOW, now)))
    force((n) => n + 1)
  }

  const burst = (n: number) => {
    for (let i = 0; i < n; i++) setTimeout(request, i * 60)
  }

  const switchAlgo = (a: Algo) => {
    setAlgo(a)
    reqs.current = []
    setPeak(0)
  }

  const now = performance.now()
  const x = (t: number) => ((t - (now - SPAN)) / SPAN) * 100
  const boundaries: number[] = []
  for (let b = Math.ceil((now - SPAN) / WINDOW) * WINDOW; b <= now; b += WINDOW) boundaries.push(b)
  const msToBoundary = WINDOW - (now % WINDOW)

  return (
    <div className="spell">
      <div className="spell-controls" role="group" aria-label="Algorithm">
        <button className={`btn sm ${algo === 'fixed' ? 'primary' : ''}`} aria-pressed={algo === 'fixed'} onClick={() => switchAlgo('fixed')}>
          Fixed window
        </button>
        <button className={`btn sm ${algo === 'sliding' ? 'primary' : ''}`} aria-pressed={algo === 'sliding'} onClick={() => switchAlgo('sliding')}>
          Sliding log
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn sm" onClick={request}>
          Send 1
        </button>
        <button className="btn sm" onClick={() => burst(8)}>
          Burst ×8
        </button>
      </div>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ width: '100%', height: 70 }} role="img" aria-label="Request timeline: green accepted, red rejected">
        {algo === 'sliding' && <rect x={x(now - WINDOW)} y="0" width={(WINDOW / SPAN) * 100} height="24" fill="var(--accent)" opacity="0.12" />}
        {algo === 'fixed' &&
          boundaries.map((b) => <line key={b} x1={x(b)} x2={x(b)} y1="0" y2="24" stroke="var(--accent)" strokeWidth="0.3" strokeDasharray="1 1" />)}
        <line x1="0" x2="100" y1="12" y2="12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.2" />
        {reqs.current.map((r) => (
          <rect key={r.t} x={x(r.t) - 0.4} y={r.ok ? 5 : 13} width="0.8" height="6" fill={r.ok ? 'var(--ok)' : 'var(--danger)'} />
        ))}
      </svg>
      <div className="spell-stats">
        <span>
          limit <b>{LIMIT} / 3 s</b>
        </span>
        <span>
          peak admitted in any 3 s <b className={peak > LIMIT ? 'bad' : 'ok'}>{peak}</b>
        </span>
        {algo === 'fixed' && (
          <span>
            next boundary in <b>{(msToBoundary / 1000).toFixed(1)} s</b>
          </span>
        )}
      </div>
      <div className="spell-note" aria-live="polite">
        {algo === 'fixed'
          ? peak > LIMIT
            ? `Boundary burst: ${peak} requests got through within 3 s; the counter reset mid-burst.`
            : 'Tip: burst just before a dashed boundary, then again just after it.'
          : 'The log counts the exact trailing 3 s, so no timing can exceed the limit.'}
      </div>
    </div>
  )
}
