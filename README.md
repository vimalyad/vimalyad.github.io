# vimalyad.github.io

Portfolio of **Vimal Kumar Yadav**, backend & systems engineer, live at https://vimalyad.github.io/.

**The Grimoire**: a 3D arcane library tower (React Three Fiber). Scroll to descend floor by floor; every floating
tome is a project, and opening one reveals a live "spell", an interactive model of that system.
`⌘K` / `Ctrl+K` (or the Search button) jumps to any project or section.
Devices that shouldn't run WebGL (no WebGL, reduced motion, Save-Data, < 4 GB RAM) get the same content over a static backdrop.

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
npm test          # vitest + jsdom: page content, dialogs, palette, every demo's logic
npm run build     # typecheck + production build to dist/
```

## Where things live

```text
src/
  data/          profile.ts, projects.ts (all project copy: sourced from each repo's README), chapters.ts
  shared/        project dialog, ⌘K palette, Konami easter egg
  spells/        the seven interactive demos (each its own lazy chunk)
  themes/
    grimoire/    Scene.tsx (tower, books, camera rig), textures.ts (procedural canvas art), Effects.tsx (bloom)
  store.ts       dialog/palette state (zustand), WebGL capability check
```

To add or edit a project, change `src/data/projects.ts`.

## Performance notes

- three.js lives in its own lazy chunk, so page text renders before the 3D scene loads; each demo is its own chunk too.
- Grimoire: no model or image downloads (all art is generated on canvas), instanced shelves (one draw call),
  fog-limited draw distance, DPR capped, rendering paused while a dialog is open, automatic quality
  drop via `PerformanceMonitor`; bloom is a separate chunk that mobile never loads.
- Fonts self-hosted (`@fontsource`), only the subsets a page uses are fetched. Portrait served as WebP (15 KB).
- `index.html` sets the theme before first paint, ships JSON-LD, OG image and a `<noscript>` fallback.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `main` (tests → build → publish `dist/`), served at https://vimalyad.github.io/.
