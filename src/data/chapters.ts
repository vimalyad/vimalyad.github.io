import type { Category } from './projects'

export type ChapterMeta = {
  category: Category
  numeral: string
  /** Title per theme, so each design keeps its own voice over the same content. */
  grimoire: string
  lab: string
  cluster: string
  blurb: string
  color: string
}

export const chapters: ChapterMeta[] = [
  {
    category: 'databases',
    numeral: 'I',
    grimoire: 'Grimoire of Persistence',
    lab: 'Storage engines',
    cluster: 'ns/databases',
    blurb: 'Databases built from the disk up: pages, logs, indexes, recovery and replication.',
    color: '#e8b55a',
  },
  {
    category: 'distributed',
    numeral: 'II',
    grimoire: 'Grimoire of Many Nodes',
    lab: 'Distributed & backend systems',
    cluster: 'ns/backend',
    blurb: 'Caches, gateways, rate limiters and servers. Coordination, throughput and failure.',
    color: '#5eead4',
  },
  {
    category: 'devops',
    numeral: 'III',
    grimoire: 'Grimoire of Deployment',
    lab: 'Delivery & open source',
    cluster: 'ns/platform',
    blurb: 'Pipelines with real gates, GitOps on Kubernetes, and contributions upstream.',
    color: '#a78bfa',
  },
  {
    category: 'ai',
    numeral: 'IV',
    grimoire: 'Grimoire of Familiars',
    lab: 'AI agents & products',
    cluster: 'ns/agents',
    blurb: 'Grounded RAG, browser agents and full-stack products shipped to real users.',
    color: '#f472b6',
  },
]
