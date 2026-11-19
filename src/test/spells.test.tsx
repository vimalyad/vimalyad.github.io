import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import WalReplay from '../spells/WalReplay'
import CrdtMerge from '../spells/CrdtMerge'
import HashRing from '../spells/HashRing'
import Rag from '../spells/Rag'
import RateWindow from '../spells/RateWindow'
import Pipeline from '../spells/Pipeline'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('WAL crash recovery', () => {
  const next = () => fireEvent.click(screen.getByRole('button', { name: /^Next:/ }))
  const recover = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Pull the plug/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Recover' }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    return screen.getByText(/^Recovered:/).textContent
  }

  it('keeps committed T1, undoes stolen uncommitted T2', async () => {
    vi.useFakeTimers()
    render(<WalReplay />)
    for (let i = 0; i < 8; i++) next()
    // Disk has T2's uncommitted A=20 (steal) and lacks T1's committed B=80 (no-force).
    expect(await recover()).toContain('A=70, B=80')
    expect(screen.getByText(/CLR T2 undo/)).toBeTruthy()
  })

  it('loses nothing durable when crashing before any commit', async () => {
    vi.useFakeTimers()
    render(<WalReplay />)
    for (let i = 0; i < 3; i++) next()
    expect(await recover()).toContain('A=100, B=50')
  })

  it('redoes a committed-but-unflushed transaction', async () => {
    vi.useFakeTimers()
    render(<WalReplay />)
    for (let i = 0; i < 4; i++) next()
    expect(await recover()).toContain('A=70, B=80')
  })
})

describe('CRDT merge', () => {
  it('converges concurrent edits with a deterministic winner', () => {
    render(<CrdtMerge />)
    fireEvent.change(screen.getByLabelText('Peer A row 1 name'), { target: { value: 'FromA' } })
    fireEvent.change(screen.getByLabelText('Peer B row 1 name'), { target: { value: 'FromB' } })
    fireEvent.click(screen.getByRole('button', { name: /Sync peers/ }))
    const a = (screen.getByLabelText('Peer A row 1 name') as HTMLInputElement).value
    const b = (screen.getByLabelText('Peer B row 1 name') as HTMLInputElement).value
    expect(a).toBe(b)
    expect(a).toBe('FromB') // equal Lamport clocks: peer id breaks the tie
    expect(screen.getByText('✓ converged')).toBeTruthy()
    const digests = screen.getAllByText(/^[0-9a-f]{8}$/).map((e) => e.textContent)
    expect(digests[0]).toBe(digests[1])
  })

  it('delete wins over a concurrent edit', () => {
    render(<CrdtMerge />)
    fireEvent.click(screen.getByLabelText('Delete row 2 on peer A'))
    fireEvent.change(screen.getByLabelText('Peer B row 2 city'), { target: { value: 'Mumbai' } })
    fireEvent.click(screen.getByRole('button', { name: /Sync peers/ }))
    expect(screen.getAllByText('tombstone')).toHaveLength(2)
    expect(screen.queryByLabelText('Peer B row 2 city')).toBeNull()
  })
})

describe('hash ring', () => {
  it('reports keys moved vs naive mod-N, and ring moves fewer', () => {
    render(<HashRing />)
    fireEvent.click(screen.getByRole('button', { name: 'Kill cache-2' }))
    const m = screen.getByText(/keys moved on the ring/).textContent!.match(/(\d+)\/40 keys moved on the ring; naive mod-N would move (\d+)/)!
    expect(Number(m[1])).toBeGreaterThan(0)
    expect(Number(m[1])).toBeLessThan(Number(m[2]))
  })
})

describe('RAG grounding', () => {
  it('cites the right chunk, and refuses without evidence', () => {
    render(<Rag />)
    fireEvent.click(screen.getByRole('button', { name: 'How do I roll back a deploy?' }))
    expect(screen.getByText(/To roll back a deploy, revert the commit/, { selector: 'p' }).textContent).toContain('[2]')
    fireEvent.click(screen.getByRole('button', { name: "What is the CEO's favourite food?" }))
    expect(screen.getByText(/can't answer that/)).toBeTruthy()
  })
})

describe('rate limiter', () => {
  it('sliding log never admits more than the limit in a burst', () => {
    render(<RateWindow />)
    fireEvent.click(screen.getByRole('button', { name: 'Sliding log' }))
    for (let i = 0; i < 9; i++) fireEvent.click(screen.getByRole('button', { name: 'Send 1' }))
    expect(screen.getByText(/peak admitted/).querySelector('b')!.textContent).toBe('5')
  })
})

describe('pipeline', () => {
  it('blocks the deploy when a gate fails', async () => {
    vi.useFakeTimers()
    render(<Pipeline />)
    fireEvent.click(screen.getByLabelText('commit an API key'))
    fireEvent.click(screen.getByRole('button', { name: 'git push' }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(screen.getByText(/Blocked: gitleaks/)).toBeTruthy()
    expect(screen.getAllByText(/pod-\d v1/)).toHaveLength(3)
  })

  it('rolls out a clean commit to every replica', async () => {
    vi.useFakeTimers()
    render(<Pipeline />)
    fireEvent.click(screen.getByRole('button', { name: 'git push' }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(screen.getAllByText(/pod-\d v2/)).toHaveLength(3)
  })
})
