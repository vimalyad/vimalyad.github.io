import { useMemo, useState } from 'react'

const CHUNKS = [
  'If the API returns 503 errors, check the connection pool. It is capped at 50 connections; raise it only after confirming the database can accept more.',
  'Deployments go out through Argo CD. To roll back a deploy, revert the commit in the config repo. Never edit the cluster by hand.',
  'Redis caches responses with a 10 minute TTL. Request collapsing in the service layer prevents a cache stampede when a hot key expires.',
  'Database backups run nightly at 02:00 UTC and are retained for 14 days in a separate region.',
  'Clients are rate limited to 100 requests per minute per API key. Exceeding the limit returns HTTP 429 with a Retry-After header.',
  'If an incident page is not acknowledged within 15 minutes, escalate to the secondary on-call engineer.',
]
const QUESTIONS = ['How do I roll back a deploy?', 'What happens when a client exceeds the rate limit?', 'How long are database backups kept?', "What is the CEO's favourite food?"]
const STOP = new Set('a an the is are do does i how what when where why to of in on for with by and or it if be was my can our its at from not this that'.split(' '))
const THRESHOLD = 1.2

const stem = (w: string) => w.replace(/(ments|ment|ing|ed|es|s)$/, '') || w
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem)

// BM25 over a six-chunk corpus: small enough to compute live on every keystroke.
const DOCS = CHUNKS.map(tokens)
const AVG = DOCS.reduce((n, d) => n + d.length, 0) / DOCS.length
const df = (t: string) => DOCS.filter((d) => d.includes(t)).length
function bm25(q: string[], d: string[]) {
  const k1 = 1.2
  const b = 0.75
  return q.reduce((sum, t) => {
    const tf = d.filter((w) => w === t).length
    if (!tf) return sum
    const idf = Math.log(1 + (DOCS.length - df(t) + 0.5) / (df(t) + 0.5))
    return sum + (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.length) / AVG))
  }, 0)
}

export default function Rag() {
  const [q, setQ] = useState(QUESTIONS[0])
  const ranked = useMemo(() => {
    const qt = [...new Set(tokens(q))]
    return CHUNKS.map((text, i) => ({ i, text, score: bm25(qt, DOCS[i]) })).sort((a, b) => b.score - a.score)
  }, [q])
  const top = ranked.slice(0, 3)
  const max = Math.max(top[0].score, THRESHOLD * 2)
  const grounded = top[0].score >= THRESHOLD

  return (
    <div className="spell">
      <div className="spell-controls">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Ask the runbook" />
      </div>
      <div className="spell-controls">
        {QUESTIONS.map((x) => (
          <button key={x} className="btn sm" onClick={() => setQ(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="spell-grid">
        <div className="spell-box">
          <h4>Retrieved chunks (BM25)</h4>
          {top.map((c, rank) => (
            <div key={c.i} className={`chunk ${rank === 0 && grounded ? 'top' : ''}`}>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                [{c.i + 1}] score {c.score.toFixed(2)}
                <div className="bar" style={{ flex: 1 }}>
                  <i style={{ width: `${(c.score / max) * 100}%` }} />
                </div>
              </div>
              {c.text}
            </div>
          ))}
        </div>
        <div className="spell-box" aria-live="polite">
          <h4>Answer</h4>
          {grounded ? (
            <p style={{ margin: 0 }}>
              {top[0].text} <b className="mono" style={{ color: 'var(--accent)' }}>[{top[0].i + 1}]</b>
            </p>
          ) : (
            <p style={{ margin: 0 }} className="bad">
              I can't answer that from the provided documents. No chunk scored above the grounding threshold ({THRESHOLD}).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
