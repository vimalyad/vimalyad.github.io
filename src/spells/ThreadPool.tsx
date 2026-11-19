import { useEffect, useRef, useState } from 'react'

type Job = { id: number; arrived: number; started?: number; cost: number }

const pct = (xs: number[], p: number) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}

/** Mirrors the server's shape: accept loop → LinkedBlockingQueue → dispatcher → fixed ExecutorService. */
export default function ThreadPool() {
  const [size, setSize] = useState(4)
  const sim = useRef({ id: 0, queue: [] as Job[], workers: [] as (Job | null)[], lat: [] as number[], served: 0, maxQ: 0 })
  const [, render] = useState(0)

  useEffect(() => {
    const s = sim.current
    // Shrinking the pool hands in-flight work back to the head of the queue rather than dropping it.
    const evicted = s.workers.slice(size).filter((j): j is Job => !!j)
    s.queue.unshift(...evicted.map((j) => ({ ...j, started: undefined })))
    s.workers = Array.from({ length: size }, (_, i) => s.workers[i] ?? null)
  }, [size])

  useEffect(() => {
    const id = setInterval(() => {
      const s = sim.current
      const now = performance.now()
      s.workers = s.workers.map((j) => {
        if (j && now - j.started! >= j.cost) {
          s.served++
          s.lat = [...s.lat.slice(-199), now - j.arrived]
          return null
        }
        return j
      })
      // Dispatcher: hand queued sockets to idle workers.
      s.workers = s.workers.map((j) => {
        if (j || !s.queue.length) return j
        const next = s.queue.shift()!
        next.started = now
        return next
      })
      render((n) => n + 1)
    }, 80)
    return () => clearInterval(id)
  }, [])

  const send = (n: number) => {
    const s = sim.current
    const now = performance.now()
    for (let i = 0; i < n; i++) s.queue.push({ id: ++s.id, arrived: now, cost: 500 + Math.random() * 900 })
    s.maxQ = Math.max(s.maxQ, s.queue.length)
  }

  const s = sim.current
  const now = performance.now()
  return (
    <div className="spell">
      <div className="spell-controls">
        <button className="btn sm primary" onClick={() => send(1)}>
          GET /
        </button>
        <button className="btn sm" onClick={() => send(25)}>
          Flood ×25
        </button>
        <label>
          pool size {size}
          <input type="range" min={1} max={10} value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>
      </div>
      <div className="spell-grid">
        <div className="spell-box">
          <h4>Blocking queue · {s.queue.length}</h4>
          <div className="cells">
            {s.queue.slice(0, 60).map((j) => (
              <span key={j.id} className="cell on" title={`request #${j.id}`} />
            ))}
            {s.queue.length > 60 && <span className="mono">+{s.queue.length - 60}</span>}
          </div>
        </div>
        <div className="spell-box">
          <h4>Workers · {s.workers.filter(Boolean).length} busy</h4>
          {s.workers.map((j, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span className="mono" style={{ width: 70, fontSize: '0.72rem' }}>
                worker-{i + 1}
              </span>
              <div className="bar" style={{ flex: 1 }}>
                <i style={{ width: j ? `${Math.min(100, ((now - j.started!) / j.cost) * 100)}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="spell-stats">
        <span>
          served <b>{s.served}</b>
        </span>
        <span>
          p50 <b>{(pct(s.lat, 50) / 1000).toFixed(2)} s</b>
        </span>
        <span>
          p95 <b>{(pct(s.lat, 95) / 1000).toFixed(2)} s</b>
        </span>
        <span>
          max queue <b>{s.maxQ}</b>
        </span>
      </div>
      <div className="spell-note">Flood it with a small pool and watch p95 climb: the work isn't slower, it's waiting in the queue.</div>
    </div>
  )
}
