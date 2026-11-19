import * as THREE from 'three'

/** Deterministic PRNG so every tome gets the same sigil on every visit. */
export function rng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
  let a = (h << 13) | (h >>> 19)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** An invented rune: 2–4 strokes between points of a 3×3 lattice. Not any real script. */
function glyph(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number) {
  const pt = () => [x + (Math.floor(r() * 3) / 2 - 0.5) * s, y + (Math.floor(r() * 3) / 2 - 0.5) * s] as const
  ctx.beginPath()
  const n = 2 + Math.floor(r() * 3)
  let [px, py] = pt()
  ctx.moveTo(px, py)
  for (let i = 0; i < n; i++) {
    ;[px, py] = pt()
    if (r() < 0.25) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function sigil(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: () => number, glyphs = true) {
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2)
  ctx.stroke()
  // {n/k} star polygons with gcd(n, k) = 1 trace one continuous star (6/2 or 8/4 collapse to a triangle or a line).
  const [pts, skip] = [[5, 2], [7, 2], [7, 3], [8, 3], [9, 4]][Math.floor(r() * 5)]
  ctx.beginPath()
  for (let i = 0; i <= pts; i++) {
    const a = ((i * skip) / pts) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * R * 0.8
    const y = cy + Math.sin(a) * R * 0.8
    if (i) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
  }
  ctx.stroke()
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8, R * 0.06, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2)
  ctx.stroke()
  if (glyphs) {
    const n = 14 + Math.floor(r() * 8)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      ctx.save()
      ctx.translate(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9)
      ctx.rotate(a + Math.PI / 2)
      glyph(ctx, 0, 0, R * 0.08, r)
      ctx.restore()
    }
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  lines.push(line)
  return lines
}

export function coverTexture(title: string, kicker: string, accent: string, seed: string) {
  const W = 512
  const H = 720
  const [c, ctx] = canvas(W, H)
  const r = rng(seed)
  // Leather: dark gradient + grain.
  const hue = Math.floor(r() * 360)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, `hsl(${hue} 30% 14%)`)
  g.addColorStop(1, `hsl(${hue} 35% 7%)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.035})`
    ctx.fillRect(r() * W, r() * H, 2, 2)
  }
  ctx.strokeStyle = accent
  ctx.fillStyle = accent
  ctx.lineWidth = 3
  ctx.strokeRect(22, 22, W - 44, H - 44)
  ctx.lineWidth = 1.5
  ctx.strokeRect(34, 34, W - 68, H - 68)
  for (const [x, y] of [
    [34, 34],
    [W - 34, 34],
    [34, H - 34],
    [W - 34, H - 34],
  ]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-9, -9, 18, 18)
    ctx.restore()
  }
  ctx.lineWidth = 2.5
  ctx.shadowColor = accent
  ctx.shadowBlur = 12
  sigil(ctx, W / 2, 285, 140, r)
  ctx.shadowBlur = 6
  ctx.textAlign = 'center'
  ctx.font = '600 22px Cinzel, serif'
  ctx.fillText(kicker.toUpperCase(), W / 2, 92)
  let size = 50
  ctx.font = `700 ${size}px Cinzel, serif`
  let lines = wrap(ctx, title, W - 110)
  while (lines.length > 3 && size > 30) {
    size -= 4
    ctx.font = `700 ${size}px Cinzel, serif`
    lines = wrap(ctx, title, W - 110)
  }
  const top = 520 - ((lines.length - 1) * size * 1.1) / 2
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * size * 1.1))
  return toTexture(c)
}

/** White line-art summoning circle; tint it with the material colour per floor. */
export function runeCircleTexture(seed = 'circle') {
  const S = 1024
  const [c, ctx] = canvas(S, S)
  const r = rng(seed)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 4
  sigil(ctx, S / 2, S / 2, S * 0.44, r)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S * 0.48, 0, Math.PI * 2)
  ctx.stroke()
  const n = 36
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    ctx.save()
    ctx.translate(S / 2 + Math.cos(a) * S * 0.46, S / 2 + Math.sin(a) * S * 0.46)
    ctx.rotate(a + Math.PI / 2)
    glyph(ctx, 0, 0, S * 0.022, r)
    ctx.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  return t
}

export function wordTexture(word: string, color: string) {
  const [c, ctx] = canvas(512, 128)
  ctx.font = '600 56px Cinzel, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.fillStyle = color
  ctx.fillText(word, 256, 64)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff8e8'
  ctx.globalAlpha = 0.85
  ctx.fillText(word, 256, 64)
  return toTexture(c)
}
