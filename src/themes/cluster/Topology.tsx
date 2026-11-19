import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chapters } from '../../data/chapters'
import { featuredBy } from '../../data/derived'
import { useStore } from '../../store'

type PodState = 'Running' | 'CrashLoopBackOff' | 'Pending'
type Pt = { x: number; y: number }
type Edge = { a: Pt; b: Pt }

const W = 1000
const BAND = 125
const H = BAND * chapters.length + 20
const INGRESS: Pt = { x: 70, y: H / 2 }
const NS_X = 300
const POD_W = 150
const POD_H = 34

// Horizontal S-curve between two points, as cubic Bézier control points.
const ctrl = ({ a, b }: Edge) => {
  const mx = (a.x + b.x) / 2
  return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b] as const
}
const pathD = (e: Edge) => {
  const [p0, p1, p2, p3] = ctrl(e)
  return `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`
}
const bez = (e: Edge, t: number): Pt => {
  const [p0, p1, p2, p3] = ctrl(e)
  const u = 1 - t
  const f = (k: 'x' | 'y') => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]
  return { x: f('x'), y: f('y') }
}

export function useLayout() {
  return useMemo(() => {
    const ns = chapters.map((c, i) => ({ ...c, at: { x: NS_X, y: 10 + BAND * i + BAND / 2 } }))
    const pods = ns.flatMap((n, i) =>
      featuredBy(n.category).map((p, j) => {
        const col = j % 3
        const row = Math.floor(j / 3)
        const rows = Math.ceil(featuredBy(n.category).length / 3)
        const top = 10 + BAND * i + BAND / 2 - (rows * (POD_H + 12)) / 2
        return { project: p, ns: n, at: { x: 470 + col * (POD_W + 22), y: top + row * (POD_H + 12) + POD_H / 2 } }
      }),
    )
    return { ns, pods }
  }, [])
}

export function Topology({ onEvent }: { onEvent: (msg: string) => void }) {
  const { ns, pods } = useLayout()
  const openProject = useStore((s) => s.openProject)
  const overcharged = useStore((s) => s.overcharged)
  const [state, setState] = useState<Record<string, PodState>>({})
  const [rps, setRps] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)
  const served = useRef(0)

  const kill = useCallback(
    (slug?: string) => {
      const running = pods.filter((p) => (state[p.project.slug] ?? 'Running') === 'Running')
      const victim = slug ? pods.find((p) => p.project.slug === slug) : running[Math.floor(Math.random() * running.length)]
      if (!victim) return
      const id = victim.project.slug
      setState((s) => ({ ...s, [id]: 'CrashLoopBackOff' }))
      onEvent(`chaos-monkey killed pod/${id} -n ${victim.ns.cluster.replace('ns/', '')}`)
      setTimeout(() => {
        setState((s) => ({ ...s, [id]: 'Pending' }))
        onEvent(`kubelet restarting pod/${id} (liveness probe failed)`)
      }, 1300)
      setTimeout(() => {
        setState((s) => ({ ...s, [id]: 'Running' }))
        onEvent(`pod/${id} Ready 1/1, traffic restored`)
      }, 2600)
    },
    [pods, state, onEvent],
  )

  // Terminal `chaos` command and the Konami code both route through here.
  useEffect(() => {
    const h = () => kill()
    window.addEventListener('chaos', h)
    return () => window.removeEventListener('chaos', h)
  }, [kill])
  useEffect(() => {
    if (!overcharged) return
    const id = setInterval(() => kill(), 600)
    return () => clearInterval(id)
  }, [overcharged, kill])

  // Packet animation: imperative SVG updates in rAF (no React re-render per frame),
  // paused when off-screen, when the tab is hidden, or for reduced-motion users.
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const g = layer.current!
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(svgRef.current!)
    type Packet = { el: SVGCircleElement; legs: Edge[]; t: number; speed: number; dropped: boolean }
    let packets: Packet[] = []
    let last = performance.now()
    let spawnAcc = 0
    let raf = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - last)
      last = now
      if (!visible || document.hidden) return
      spawnAcc += dt
      if (spawnAcc > 140 && packets.length < 40) {
        spawnAcc = 0
        const pod = pods[Math.floor(Math.random() * pods.length)]
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        el.setAttribute('r', '3.2')
        el.setAttribute('fill', pod.ns.color)
        g.appendChild(el)
        packets.push({ el, legs: [{ a: INGRESS, b: { x: pod.ns.at.x - 60, y: pod.ns.at.y } }, { a: { x: pod.ns.at.x + 60, y: pod.ns.at.y }, b: { x: pod.at.x - POD_W / 2, y: pod.at.y } }], t: 0, speed: 0.0011 + Math.random() * 0.0006, dropped: (stateRef.current[pod.project.slug] ?? 'Running') !== 'Running' })
      }
      packets = packets.filter((p) => {
        p.t += dt * p.speed
        if (p.t >= 2 || (p.dropped && p.t >= 1.85)) {
          if (!p.dropped) served.current++
          p.el.remove()
          return false
        }
        const leg = p.legs[p.t < 1 ? 0 : 1]
        const { x, y } = bez(leg, p.t % 1)
        p.el.setAttribute('cx', String(x))
        p.el.setAttribute('cy', String(y))
        if (p.dropped && p.t > 1.6) p.el.setAttribute('fill', 'var(--danger)')
        return true
      })
    }
    raf = requestAnimationFrame(tick)
    const meter = setInterval(() => {
      setRps(served.current)
      served.current = 0
    }, 1000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(meter)
      io.disconnect()
      packets.forEach((p) => p.el.remove())
    }
  }, [pods])

  return (
    <div className="cl-topo">
      <div className="cl-topo-bar">
        <span>
          <b className="ok">●</b> cluster: vimal-prod · {pods.length} pods · {ns.length} namespaces
        </span>
        <span className="mono">{rps} req/s</span>
        <button className="btn sm" onClick={() => kill()} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          ☠ Unleash chaos monkey
        </button>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Service topology. Each pod is a project; select one to open it.">
        {ns.map((n) => (
          <path key={n.category} d={pathD({ a: INGRESS, b: { x: n.at.x - 60, y: n.at.y } })} className="cl-edge" />
        ))}
        {pods.map((p) => (
          <path key={p.project.slug} d={pathD({ a: { x: p.ns.at.x + 60, y: p.ns.at.y }, b: { x: p.at.x - POD_W / 2, y: p.at.y } })} className="cl-edge" />
        ))}
        <g ref={layer} />
        <g className="cl-node">
          <circle cx={INGRESS.x} cy={INGRESS.y} r="34" />
          <text x={INGRESS.x} y={INGRESS.y - 2} textAnchor="middle">
            ingress
          </text>
          <text x={INGRESS.x} y={INGRESS.y + 12} textAnchor="middle" className="cl-sub">
            :443
          </text>
        </g>
        {ns.map((n) => (
          <g key={n.category} className="cl-node">
            <rect x={n.at.x - 60} y={n.at.y - 20} width="120" height="40" rx="6" style={{ stroke: n.color }} />
            <text x={n.at.x} y={n.at.y + 4} textAnchor="middle" style={{ fill: n.color }}>
              {n.cluster}
            </text>
          </g>
        ))}
        {pods.map((p) => {
          const st = state[p.project.slug] ?? 'Running'
          return (
            <g
              key={p.project.slug}
              className={`cl-pod ${st}`}
              tabIndex={0}
              role="button"
              aria-label={`${p.project.name}, ${st}. Open project.`}
              onClick={() => openProject(p.project.slug)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openProject(p.project.slug))}
            >
              <rect x={p.at.x - POD_W / 2} y={p.at.y - POD_H / 2} width={POD_W} height={POD_H} rx="5" />
              <circle cx={p.at.x - POD_W / 2 + 12} cy={p.at.y} r="4" className="cl-dot" />
              <text x={p.at.x - POD_W / 2 + 22} y={p.at.y + 4}>
                {p.project.slug.length > 17 ? p.project.slug.slice(0, 16) + '…' : p.project.slug}
              </text>
              <title>{`${p.project.name}: ${st}`}</title>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
