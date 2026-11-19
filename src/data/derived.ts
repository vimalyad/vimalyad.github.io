import { projects, contributions, type Category } from './projects'

export const featuredBy = (c: Category) => projects.filter((p) => p.featured && p.category === c)
export const archive = projects.filter((p) => !p.featured).sort((a, b) => b.year - a.year)
// Closed-unmerged PRs are left out; merged first, then open.
export const upstream = contributions
  .filter((c) => c.state !== 'closed')
  .sort((a, b) => (a.state === b.state ? b.date.localeCompare(a.date) : a.state === 'merged' ? -1 : 1))
