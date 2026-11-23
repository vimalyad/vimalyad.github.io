# vimalyad.github.io

Portfolio of **Vimal Kumar Yadav**, backend & systems engineer. One content layer, four switchable designs:

| Design | What it is | Extra JS |
| --- | --- | --- |
| **Grimoire** | A 3D arcane library tower (React Three Fiber). Scroll to descend floor by floor; every floating tome is a project. | three.js chunk, loaded only for this design |
| **Systems Lab** | Light, editorial "lab notebook". Every project card can run a live simulation inline. | ~2 KB |
| **Cluster** | Command center: live service topology with a chaos monkey, plus a working terminal (`help`, `kubectl get pods -A`, Tab completion). | ~7 KB |
| **Résumé** | Plain, printable, recruiter-first. | ~1 KB |

Switch with the pill at the bottom of the page, `⌘K` / `Ctrl+K`, or `?theme=grimoire|lab|cluster|resume`. The choice is remembered.
Devices that can't comfortably run WebGL (no WebGL, reduced-motion, Save-Data, < 4 GB RAM) default to the Lab.

## Interactive demos ("spells")

Each is a small, honest model of a real repo, loaded only when opened:

| Demo | Project | Shows |
| --- | --- | --- |
| Crash & recover | VersionDB | WAL rule, steal/no-force, ARIES analysis → redo → undo with CLRs |
| Offline merge | CRDT-Native Relational DB | Per-cell LWW registers with Lamport versions, delete-wins tombstones, digest convergence |
| Consistent hashing | Distributed Cache | Virtual nodes; keys moved vs naive mod-N on node loss |
| Fixed window vs sliding log | Rate Limiter | The fixed-window boundary burst |
| Worker pool | HTTP server | Blocking queue → fixed pool; queueing drives p95 |
| Gated delivery | DevOps capstones | Test/secret/CVE gates, rolling update, Argo CD self-heal |
| Grounded retrieval | DocBuddy | BM25 ranking, citations, refusing without evidence |

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # vitest + jsdom: all four designs, terminal, palette, every demo's logic
npm run build     # typecheck + production build to dist/
```

## Where things live

```text
src/
  data/          profile.ts, projects.ts (all project copy: sourced from each repo's README), chapters.ts
  shared/        theme switcher, project dialog, ⌘K palette, Konami easter egg
  spells/        the seven interactive demos (each its own lazy chunk)
  themes/
    grimoire/    Scene.tsx (tower, books, camera rig), textures.ts (procedural canvas art), Effects.tsx (bloom)
    lab/  cluster/  resume/
  store.ts       theme + dialog state (zustand)
```

To add or edit a project, change `src/data/projects.ts`; every design picks it up.

## Performance notes

- Code-split per design and per demo; hovering a design in the switcher prefetches it.
- Grimoire: no model or image downloads (all art is generated on canvas), instanced shelves (one draw call),
  fog-limited draw distance, DPR capped, rendering paused while a dialog is open, automatic quality
  drop via `PerformanceMonitor`; bloom is a separate chunk that mobile never loads.
- Fonts self-hosted (`@fontsource`), only the subsets a page uses are fetched. Portrait served as WebP (15 KB).
- `index.html` sets the theme before first paint, ships JSON-LD, OG image and a `<noscript>` fallback.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `main` (tests → build → publish `dist/`), served at https://vimalyad.github.io/.
