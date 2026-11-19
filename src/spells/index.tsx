import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import type { Spell } from '../data/projects'
import './spells.css'

type Concrete = Exclude<Spell, 'none'>

export const spellInfo: Record<Concrete, { title: string; caption: string }> = {
  'btree-wal': {
    title: 'Crash & recover',
    caption: 'Step through transactions, pull the plug at any moment, then watch write-ahead-log recovery (analysis → redo → undo) restore exactly the committed state.',
  },
  crdt: {
    title: 'Offline merge',
    caption: 'Two peers edit the same table while disconnected. Hit sync: every cell converges deterministically with no coordinator.',
  },
  'hash-ring': {
    title: 'Consistent hashing',
    caption: 'Keys live on a hash ring. Kill or add a cache node and see how few keys move compared to naive hash-mod-N.',
  },
  "rate-window": {
    title: "Fixed window vs sliding log",
    caption: "Both algorithms allow 5 requests per 3 s. Fire requests either side of a window boundary: the fixed window lets through up to double, the sliding log never does.",
  },
  'thread-pool': {
    title: 'Worker pool under load',
    caption: 'Requests queue for a fixed pool of worker threads. Flood it, resize the pool, and watch latency and rejections change.',
  },
  pipeline: {
    title: 'Gated delivery',
    caption: 'Push a commit through test and security gates to a GitOps rollout. Sabotage a gate and the deploy is blocked.',
  },
  rag: {
    title: 'Grounded retrieval',
    caption: 'Ask a question about a tiny runbook. Chunks are ranked, the answer cites them, and with no evidence it refuses to guess.',
  },
}

const views: Record<Concrete, LazyExoticComponent<ComponentType>> = {
  'btree-wal': lazy(() => import('./WalReplay')),
  crdt: lazy(() => import('./CrdtMerge')),
  'hash-ring': lazy(() => import('./HashRing')),
  'rate-window': lazy(() => import('./RateWindow')),
  'thread-pool': lazy(() => import('./ThreadPool')),
  pipeline: lazy(() => import('./Pipeline')),
  rag: lazy(() => import('./Rag')),
}

export function SpellView({ spell }: { spell: Spell }) {
  if (spell === 'none') return null
  const View = views[spell]
  return (
    <Suspense fallback={<div className="spell spell-loading">Preparing…</div>}>
      <View />
    </Suspense>
  )
}
