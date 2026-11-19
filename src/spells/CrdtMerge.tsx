import { useState } from 'react'
import { fnv1a } from './useTick'

type Ver = [lamport: number, peer: string]
type Cell = { v: string; ver: Ver }
type Replica = { peer: string; clock: number; cells: Record<string, Cell>; dead: Record<string, boolean>; touched: string[] }

const ROWS = ['1', '2', '3']
const COLS = ['name', 'city'] as const
const SEED: Record<string, string> = { '1.name': 'Asha', '1.city': 'Pune', '2.name': 'Ravi', '2.city': 'Delhi', '3.name': 'Meera', '3.city': 'Goa' }

const fresh = (peer: string): Replica => ({
  peer,
  clock: 1,
  cells: Object.fromEntries(Object.entries(SEED).map(([k, v]) => [k, { v, ver: [1, 'seed'] as Ver }])),
  dead: {},
  touched: [],
})

// Total order on versions: higher Lamport wins, peer id breaks ties, so every replica picks the same winner.
const newer = (a: Ver, b: Ver) => a[0] - b[0] || a[1].localeCompare(b[1])

const digest = (r: Replica) =>
  fnv1a(JSON.stringify([ROWS.map((row) => (r.dead[row] ? 'x' : COLS.map((c) => r.cells[`${row}.${c}`].v)))]))
    .toString(16)
    .padStart(8, '0')

export default function CrdtMerge() {
  const [reps, setReps] = useState<[Replica, Replica]>([fresh('A'), fresh('B')])
  const [conflicts, setConflicts] = useState<Record<string, string>>({})
  const [note, setNote] = useState('Peers are offline. Edit both sides (even the same cell), or delete a row on one side and edit it on the other.')
  const [synced, setSynced] = useState(false)

  const update = (i: 0 | 1, fn: (r: Replica) => Replica) => {
    setSynced(false)
    setConflicts({})
    setReps((rs) => (i === 0 ? [fn(rs[0]), rs[1]] : [rs[0], fn(rs[1])]))
  }

  const edit = (i: 0 | 1, key: string, v: string) =>
    update(i, (r) => {
      const clock = r.clock + 1
      return { ...r, clock, cells: { ...r.cells, [key]: { v, ver: [clock, r.peer] } }, touched: [...new Set([...r.touched, key])] }
    })

  const del = (i: 0 | 1, row: string) =>
    update(i, (r) => ({ ...r, clock: r.clock + 1, dead: { ...r.dead, [row]: true }, touched: [...new Set([...r.touched, `row${row}`])] }))

  const sync = () => {
    const [a, b] = reps
    const cells: Record<string, Cell> = {}
    const conf: Record<string, string> = {}
    for (const k of Object.keys(SEED)) {
      const win = newer(a.cells[k].ver, b.cells[k].ver) >= 0 ? a.cells[k] : b.cells[k]
      cells[k] = win
      if (a.touched.includes(k) && b.touched.includes(k)) conf[k] = `both edited; ${win.ver[1]} wins (Lamport ${win.ver[0]})`
    }
    const dead: Record<string, boolean> = {}
    for (const row of ROWS) {
      dead[row] = !!(a.dead[row] || b.dead[row]) // delete-wins tombstone
      if (dead[row] && COLS.some((c) => a.touched.includes(`${row}.${c}`) || b.touched.includes(`${row}.${c}`)))
        conf[`row${row}`] = 'edited on one peer, deleted on the other; delete wins'
    }
    const clock = Math.max(a.clock, b.clock)
    const merged = (peer: string): Replica => ({ peer, clock, cells: { ...cells }, dead: { ...dead }, touched: [] })
    setReps([merged('A'), merged('B')])
    setConflicts(conf)
    setSynced(true)
    const n = Object.keys(conf).length
    setNote(n ? `Synced. ${n} conflict${n > 1 ? 's' : ''} resolved deterministically (hover the outlined cells).` : 'Synced. No conflicts: deltas simply merged.')
  }

  return (
    <div className="spell">
      <div className="spell-controls">
        <button className="btn sm primary" onClick={sync}>
          ⇄ Sync peers
        </button>
        <button
          className="btn sm"
          onClick={() => {
            setReps([fresh('A'), fresh('B')])
            setConflicts({})
            setSynced(false)
          }}
        >
          Reset
        </button>
      </div>
      <div className="spell-grid">
        {reps.map((r, i) => (
          <div key={r.peer} className="spell-box">
            <h4>
              Peer {r.peer} · lamport {r.clock}
            </h4>
            <table className="crdt-table">
              <thead>
                <tr>
                  <th>id</th>
                  {COLS.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) =>
                  r.dead[row] ? (
                    <tr key={row}>
                      <th>{row}</th>
                      <td colSpan={3} className={conflicts[`row${row}`] ? 'conflict' : ''} title={conflicts[`row${row}`]}>
                        <span className="mono bad">tombstone</span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row}>
                      <th>{row}</th>
                      {COLS.map((c) => {
                        const k = `${row}.${c}`
                        return (
                          <td key={c} className={`${r.touched.includes(k) ? 'dirty' : ''} ${conflicts[k] ? 'conflict' : ''}`} title={conflicts[k]}>
                            <input aria-label={`Peer ${r.peer} row ${row} ${c}`} value={r.cells[k].v} onChange={(e) => edit(i as 0 | 1, k, e.target.value)} />
                          </td>
                        )
                      })}
                      <td>
                        <button className="pd-close" style={{ width: 22, height: 22, fontSize: 12 }} aria-label={`Delete row ${row} on peer ${r.peer}`} onClick={() => del(i as 0 | 1, row)}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="spell-stats">
        <span>
          digest A <b>{digest(reps[0])}</b>
        </span>
        <span>
          digest B <b>{digest(reps[1])}</b>
        </span>
        {synced && <b className="ok">✓ converged</b>}
      </div>
      <div className="spell-note" aria-live="polite">
        {note}
      </div>
    </div>
  )
}
