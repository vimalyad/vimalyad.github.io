import type { Category } from './projects'

export type ChapterMeta = {
  category: Category
  numeral: string
  grimoire: string
  blurb: string
  color: string
}

export const chapters: ChapterMeta[] = [
  {
    category: 'databases',
    numeral: 'I',
    grimoire: 'Grimoire of Persistence',
    blurb: 'Databases built from the disk up: pages, logs, indexes, recovery and replication.',
    color: '#e8b55a',
  },
  {
    category: 'distributed',
    numeral: 'II',
    grimoire: 'Grimoire of Many Nodes',
    blurb: 'Caches, gateways, rate limiters and servers. Coordination, throughput and failure.',
    color: '#5eead4',
  },
  {
    category: 'devops',
    numeral: 'III',
    grimoire: 'Grimoire of Deployment',
    blurb: 'Pipelines with real gates, GitOps on Kubernetes, and contributions upstream.',
    color: '#a78bfa',
  },
  {
    category: 'ai',
    numeral: 'IV',
    grimoire: 'Grimoire of Familiars',
    blurb: 'Grounded RAG, browser agents and full-stack products shipped to real users.',
    color: '#f472b6',
  },
]
