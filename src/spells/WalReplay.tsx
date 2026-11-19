import { useRef, useState } from 'react'
import { sleep } from './useTick'

type Key = 'A' | 'B'
type Vals = Record<Key, number>
type Op =
  | { kind: 'begin' | 'commit'; tx: string }
  | { kind: 'update'; tx: string; key: Key; from: number; to: number }
  | { kind: 'flush'; key: Key }
type Rec = { lsn: number; durable: boolean; text: string; tx?: string; kind: string; key?: Key; from?: number; to?: number }
type Phase = 'running' | 'crashed' | 'recovering' | 'done'

const SCRIPT: Op[] = [
  { kind: 'begin', tx: 'T1' },
  { kind: 'update', tx: 'T1', key: 'A', from: 100, to: 70 },
  { kind: 'update', tx: 'T1', key: 'B', from: 50, to: 80 },
  { kind: 'commit', tx: 'T1' },
  { kind: 'begin', tx: 'T2' },
  { kind: 'update', tx: 'T2', key: 'A', from: 70, to: 20 },
  { kind: 'flush', key: 'A' },
  { kind: 'update', tx: 'T2', key: 'B', from: 80, to: 0 },
]
const DISK0: Vals = { A: 100, B: 50 }

const describe = (op: Op) =>
  op.kind === 'flush'
    ? `buffer manager evicts page ${op.key} to disk`
    : op.kind === 'update'
      ? `${op.tx}: SET ${op.key} = ${op.to}`
      : `${op.tx}: ${op.kind.toUpperCase()}`

export default function WalReplay() {
  const [step, setStep] = useState(0)
  const [log, setLog] = useState<Rec[]>([])
  const [buffer, setBuffer] = useState<Vals | null>({ ...DISK0 })
  const [disk, setDisk] = useState<Vals>({ ...DISK0 })
  const [phase, setPhase] = useState<Phase>('running')
  const [hl, setHl] = useState<number | null>(null)
  const [losers, setLosers] = useState<string[]>([])
  const [note, setNote] = useState('Step through the workload, then pull the plug whenever you like.')
  const run = useRef(0) // generation counter: lets Reset cancel an in-flight recovery animation

  const append = (r: Omit<Rec, 'lsn'>, l: Rec[]) => [...l, { ...r, lsn: l.length + 1 }]

  const next = () => {
    const op = SCRIPT[step]
    if (!op || !buffer) return
    let l = log
    if (op.kind === 'update') {
      l = append({ ...op, durable: false, text: `${op.tx} UPDATE ${op.key} ${op.from}→${op.to}` }, l)
      setBuffer({ ...buffer, [op.key]: op.to })
      setNote(`Log record appended to the in-memory log tail; page ${op.key} is dirty in the buffer pool.`)
    } else if (op.kind === 'begin') {
      l = append({ ...op, durable: false, text: `${op.tx} BEGIN` }, l)
      setNote(`${op.tx} starts.`)
    } else if (op.kind === 'commit') {
      l = append({ ...op, durable: false, text: `${op.tx} COMMIT` }, l).map((r) => ({ ...r, durable: true }))
      setNote(`COMMIT forces the log to disk. Data pages stay in memory (no-force), so the disk still shows old values.`)
    } else if (op.kind === 'flush') {
      l = l.map((r) => ({ ...r, durable: true }))
      setDisk((d) => ({ ...d, [op.key]: buffer[op.key] }))
      setNote(`WAL rule: the log is flushed before page ${op.key} is written. Page ${op.key} = ${buffer[op.key]} hits disk even though T2 hasn't committed (steal).`)
    }
    setLog(l)
    setStep(step + 1)
  }

  const crash = () => {
    setLog((l) => l.filter((r) => r.durable))
    setBuffer(null)
    setPhase('crashed')
    setNote('Power lost. The buffer pool and the unflushed log tail are gone; only disk pages and the durable log survive.')
  }

  const recover = async () => {
    const gen = ++run.current
    const alive = () => run.current === gen
    setPhase('recovering')
    const durable = log
    // 1. Analysis: who committed, who was in flight?
    setNote('Analysis: scanning the log to find committed and in-flight transactions…')
    const begun = new Set<string>()
    const committed = new Set<string>()
    for (const r of durable) {
      setHl(r.lsn)
      if (r.kind === 'begin') begun.add(r.tx!)
      if (r.kind === 'commit') committed.add(r.tx!)
      await sleep(350)
      if (!alive()) return
    }
    const lose = [...begun].filter((t) => !committed.has(t))
    setLosers(lose)
    // 2. Redo: repeat history, every logged update, committed or not.
    setNote(`Redo: repeating history from disk state. Losers: ${lose.join(', ') || 'none'}.`)
    const mem: Vals = { ...disk }
    setBuffer({ ...mem })
    for (const r of durable) {
      if (r.kind !== 'update') continue
      setHl(r.lsn)
      mem[r.key!] = r.to!
      setBuffer({ ...mem })
      await sleep(550)
      if (!alive()) return
    }
    // 3. Undo: roll back losers newest-first, logging a compensation record for each.
    let l = durable
    const undo = durable.filter((r) => r.kind === 'update' && lose.includes(r.tx!)).reverse()
    if (undo.length) setNote('Undo: rolling back loser updates newest-first, writing a CLR for each.')
    for (const r of undo) {
      setHl(r.lsn)
      mem[r.key!] = r.from!
      setBuffer({ ...mem })
      l = append({ kind: 'clr', tx: r.tx, durable: true, text: `CLR ${r.tx} undo LSN ${r.lsn}: ${r.key}=${r.from}` }, l)
      setLog(l)
      await sleep(650)
      if (!alive()) return
    }
    for (const t of lose) l = append({ kind: 'end', tx: t, durable: true, text: `${t} END (aborted)` }, l)
    setLog(l)
    setHl(null)
    setDisk({ ...mem })
    setPhase('done')
    setNote(`Recovered: A=${mem.A}, B=${mem.B}. Every committed change survived, and nothing uncommitted did.`)
  }

  const reset = () => {
    run.current++
    setStep(0)
    setLog([])
    setBuffer({ ...DISK0 })
    setDisk({ ...DISK0 })
    setPhase('running')
    setHl(null)
    setLosers([])
    setNote('Step through the workload, then pull the plug whenever you like.')
  }

  const Values = ({ v }: { v: Vals | null }) =>
    v ? (
      <div className="mono">
        A = <b>{v.A}</b>
        <br />B = <b>{v.B}</b>
      </div>
    ) : (
      <div className="mono bad">lost in crash</div>
    )

  return (
    <div className="spell">
      <div className="spell-controls">
        <button className="btn sm primary" onClick={next} disabled={phase !== 'running' || step >= SCRIPT.length}>
          {step < SCRIPT.length ? `Next: ${describe(SCRIPT[step])}` : 'Workload finished'}
        </button>
        <button className="btn sm" onClick={crash} disabled={phase !== 'running'} style={{ borderColor: 'var(--danger)' }}>
          ⚡ Pull the plug
        </button>
        <button className="btn sm" onClick={recover} disabled={phase !== 'crashed'}>
          Recover
        </button>
        <button className="btn sm" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="spell-grid wal">
        <div className="spell-box" aria-label="Write-ahead log">
          <h4>WAL · ● durable ○ in memory</h4>
          {log.length === 0 && <div className="mono" style={{ color: 'var(--muted)' }}>empty</div>}
          {log.map((r) => (
            <div key={r.lsn} className={`log-row ${r.durable ? '' : 'volatile'} ${hl === r.lsn ? 'hl' : ''} ${r.tx && losers.includes(r.tx) && r.kind === 'update' ? 'loser' : ''}`}>
              <span>{r.durable ? '●' : '○'}</span>
              <span>{String(r.lsn).padStart(2, '0')}</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
        <div className="spell-box">
          <h4>Buffer pool</h4>
          <Values v={buffer} />
        </div>
        <div className="spell-box">
          <h4>Disk pages</h4>
          <Values v={disk} />
        </div>
      </div>
      <div className="spell-note" aria-live="polite">
        {note}
      </div>
    </div>
  )
}
