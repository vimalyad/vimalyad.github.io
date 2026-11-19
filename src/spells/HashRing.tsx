import { useMemo, useState } from 'react'
import { fnv1a } from './useTick'

const KEYS = Array.from({ length: 40 }, (_, i) => `user:${i + 1}`)
const VNODES = 4
const PALETTE = ['#e8b55a', '#5eead4', '#a78bfa', '#f472b6', '#60a5fa', '#f97316', '#4ade80']
const TAU = Math.PI * 2
const MAX = 2 ** 32

function owners(nodes: string[]) {
  const ring = nodes
    .flatMap((n) => Array.from({ length: VNODES }, (_, v) => ({ node: n, h: fnv1a(`${n}#${v}`) })))
    .sort((a, b) => a.h - b.h)
  const map = new Map<string, string>()
  for (const k of KEYS) {
    const h = fnv1a(k)
    map.set(k, (ring.find((r) => r.h >= h) ?? ring[0])?.node ?? '')
  }
  return { ring, map }
}

const pos = (h: number, r: number) => {
  const a = (h / MAX) * TAU - Math.PI / 2
  return [130 + Math.cos(a) * r, 130 + Math.sin(a) * r] as const
}

export default function HashRing() {
  const [nodes, setNodes] = useState(['cache-1', 'cache-2', 'cache-3', 'cache-4'])
  const [next, setNext] = useState(5)
  const [moved, setMoved] = useState<{ ring: number; naive: number } | null>(null)
  const { ring, map } = useMemo(() => owners(nodes), [nodes])
  const color = (n: string) => PALETTE[(parseInt(n.split('-')[1]) - 1) % PALETTE.length]

  const change = (after: string[]) => {
    if (after.length === 0) return
    const before = owners(nodes).map
    const now = owners(after).map
    const ringMoved = KEYS.filter((k) => before.get(k) !== now.get(k)).length
    // What a naive `hash(key) % N` scheme would have moved for the same change:
    const naive = KEYS.filter((k) => fnv1a(k) % nodes.length !== fnv1a(k) % after.length).length
    setMoved({ ring: ringMoved, naive })
    setNodes(after)
  }

  return (
    <div className="spell">
      <div className="spell-controls">
        <button className="btn sm primary" onClick={() => (change([...nodes, `cache-${next}`]), setNext(next + 1))} disabled={nodes.length >= 7}>
          + Add node
        </button>
        {nodes.map((n) => (
          <button key={n} className="btn sm" onClick={() => change(nodes.filter((x) => x !== n))} disabled={nodes.length <= 1} style={{ borderColor: color(n) }}>
            Kill {n}
          </button>
        ))}
      </div>
      <div className="spell-grid" style={{ alignItems: 'center' }}>
        <svg viewBox="0 0 260 260" role="img" aria-label={`Hash ring with ${nodes.length} nodes and ${KEYS.length} keys`} style={{ maxWidth: 300 }}>
          <circle cx="130" cy="130" r="105" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          {KEYS.map((k) => {
            const [x, y] = pos(fnv1a(k), 88)
            return <circle key={k} cx={x} cy={y} r="4" fill={color(map.get(k)!)} style={{ transition: 'fill .4s' }}><title>{`${k} → ${map.get(k)}`}</title></circle>
          })}
          {ring.map((r) => {
            const [x, y] = pos(r.h, 105)
            return <rect key={`${r.node}${r.h}`} x={x - 5} y={y - 5} width="10" height="10" rx="2" fill={color(r.node)} stroke="var(--bg)" />
          })}
        </svg>
        <div>
          <p style={{ marginTop: 0 }}>
            Squares are virtual nodes ({VNODES} per server); dots are keys, coloured by the server that owns them (the next square clockwise).
          </p>
          <div className="spell-note" aria-live="polite">
            {moved ? `${moved.ring}/${KEYS.length} keys moved on the ring; naive mod-N would move ${moved.naive}.` : 'Kill a node to see the rebalance.'}
          </div>
        </div>
      </div>
    </div>
  )
}
