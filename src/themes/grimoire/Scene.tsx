import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import type { Project } from '../../data/projects'
import { useStore } from '../../store'
import { floorState } from './scroll'
import { coverTexture, rng, runeCircleTexture, wordTexture } from './textures'

const Effects = lazy(() => import('./Effects'))

export type FloorDef = {
  kind: 'hero' | 'origin' | 'chapter' | 'archive' | 'summon'
  color: string
  label: string
  projects?: Project[]
  words?: string[]
}
type Tier = 'high' | 'low'

const FLOOR_H = 12
const TOWER_R = 16
const floorY = (i: number) => -i * FLOOR_H
const tmpV = new THREE.Vector3()
const tmpR = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

/* ---------------- Camera: descends the tower following scroll ---------------- */
function CameraRig({ floors, light }: { floors: FloorDef[]; light: React.RefObject<THREE.PointLight | null> }) {
  const cur = useRef(floorState.floor)
  const look = useRef(new THREE.Vector3())
  const colA = useMemo(() => new THREE.Color(), [])
  const colB = useMemo(() => new THREE.Color(), [])
  useFrame((state, dt) => {
    cur.current = THREE.MathUtils.damp(cur.current, floorState.floor, 3.2, dt)
    const f = cur.current
    const y = floorY(f)
    const theta = f * 0.85 + 0.6
    const cam = state.camera as THREE.PerspectiveCamera
    // Portrait screens: widen the lens so the orbiting tomes aren't clipped at the edges.
    const fov = state.size.width < state.size.height ? 68 : 50
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    const px = state.pointer.x
    const py = state.pointer.y
    cam.position.set(Math.cos(theta) * 10.5, y + 1.4 + py * 0.35, Math.sin(theta) * 10.5)
    // Right vector of the view, for parallax and for pushing the scene beside the text column.
    tmpV.set(0, y, 0).sub(cam.position).normalize()
    tmpR.crossVectors(tmpV, UP).normalize()
    cam.position.addScaledVector(tmpR, px * 0.5)
    const wide = state.size.width >= 1000
    const target = look.current.set(0, y - 0.2, 0)
    if (wide) target.addScaledVector(tmpR, -2.5)
    else target.y -= 1.9
    cam.lookAt(target)
    // The floor light follows the camera and blends between chapter colours.
    if (light.current) {
      const i = Math.floor(f)
      const t = f - i
      colA.set(floors[Math.min(i, floors.length - 1)].color)
      colB.set(floors[Math.min(i + 1, floors.length - 1)].color)
      light.current.color.copy(colA.lerp(colB, t))
      light.current.position.set(0, y + 2.5, 0)
    }
  })
  return null
}

/* ---------------- Tower: walls, shelves (instanced), balconies ---------------- */
const LEATHER = ['#4a2323', '#26304d', '#2f4a2c', '#5a4022', '#3c2547', '#21403f', '#5c5240', '#3a1f1f']

const Tower = memo(function Tower({ count, tier }: { count: number; tier: Tier }) {
  const height = count * FLOOR_H + 30
  const rows = tier === 'high' ? 4 : 2
  const books = useMemo(() => {
    const r = rng('shelves')
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    const mats: THREE.Matrix4[] = []
    const cols: THREE.Color[] = []
    const R = TOWER_R - 0.55
    for (let f = 0; f < count; f++) {
      for (let row = 0; row < rows; row++) {
        const base = floorY(f) - 4.6 + row * (tier === 'high' ? 2.2 : 3.4)
        let a = 0
        while (a < Math.PI * 2) {
          const w = 0.1 + r() * 0.16
          const h = 1.0 + r() * 0.65
          if (r() > 0.06) {
            dummy.position.set(Math.cos(a) * R, base + h / 2, Math.sin(a) * R)
            dummy.scale.set(w, h, 0.75)
            dummy.lookAt(0, base + h / 2, 0)
            dummy.rotateZ((r() - 0.5) * (r() > 0.92 ? 0.5 : 0.04))
            dummy.updateMatrix()
            mats.push(dummy.matrix.clone())
            cols.push(color.set(LEATHER[Math.floor(r() * LEATHER.length)]).clone().multiplyScalar(0.7 + r() * 0.6))
          }
          a += (w + 0.025) / R
        }
      }
    }
    return { mats, cols }
  }, [count, rows, tier])

  const inst = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const m = inst.current!
    books.mats.forEach((mat, i) => {
      m.setMatrixAt(i, mat)
      m.setColorAt(i, books.cols[i])
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [books])

  const shelfCount = count * rows
  const shelves = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const dummy = new THREE.Object3D()
    let k = 0
    for (let f = 0; f < count; f++)
      for (let row = 0; row < rows; row++) {
        dummy.position.set(0, floorY(f) - 4.6 + row * (tier === 'high' ? 2.2 : 3.4) - 0.05, 0)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.updateMatrix()
        shelves.current!.setMatrixAt(k++, dummy.matrix)
      }
    shelves.current!.instanceMatrix.needsUpdate = true
  }, [count, rows, tier])

  return (
    <group>
      <mesh position={[0, -height / 2 + 15, 0]}>
        <cylinderGeometry args={[TOWER_R, TOWER_R, height, 48, 1, true]} />
        <meshStandardMaterial color="#120d18" roughness={1} side={THREE.BackSide} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, books.mats.length]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={shelves} args={[undefined, undefined, shelfCount]} frustumCulled={false}>
        <ringGeometry args={[TOWER_R - 1.05, TOWER_R, 64]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      {Array.from({ length: count + 1 }, (_, f) => (
        <mesh key={f} position={[0, floorY(f) + 6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11.6, TOWER_R, 64]} />
          <meshStandardMaterial color="#17110f" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
})

/* ---------------- Rune circles under every floor ---------------- */
function RuneCircles({ floors }: { floors: FloorDef[] }) {
  const tex = useMemo(() => runeCircleTexture('vky'), [])
  useEffect(() => () => tex.dispose(), [tex])
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const overcharged = useStore((s) => s.overcharged)
  useFrame((_, dt) => {
    refs.current.forEach((m, i) => m && (m.rotation.z += dt * (overcharged ? 1.2 : 0.06) * (i % 2 ? 1 : -1)))
  })
  return (
    <>
      {floors.map((f, i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)} position={[0, floorY(i) - 3.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[f.kind === 'summon' ? 8 : 6.5, f.kind === 'summon' ? 8 : 6.5]} />
          <meshBasicMaterial map={tex} color={f.color} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

/* ---------------- A grimoire: hinged cover, page block, glow ---------------- */
type BookProps = {
  title: string
  kicker: string
  color: string
  seed: string
  y: number
  radius: number
  angle: number
  scale?: number
  label: string
  onActivate: () => void
}

function Book({ title, kicker, color, seed, y, radius, angle, scale = 1, onActivate }: BookProps) {
  const group = useRef<THREE.Group>(null)
  const hinge = useRef<THREE.Group>(null)
  const coverMat = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const [opened, setOpened] = useState(false)
  useCursor(hovered)
  const tex = useMemo(() => coverTexture(title, kicker, color, seed), [title, kicker, color, seed])
  useEffect(() => () => tex.dispose(), [tex])
  const phase = useMemo(() => rng(seed)() * Math.PI * 2, [seed])
  const W = 1.1
  const H = 1.55
  const T = 0.26

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const a = angle + t * 0.07
    g.position.set(Math.cos(a) * radius, y + Math.sin(t * 0.9 + phase) * 0.18, Math.sin(a) * radius)
    g.lookAt(state.camera.position.x, g.position.y, state.camera.position.z)
    g.rotateY(Math.sin(t * 0.5 + phase) * 0.12)
    const s = THREE.MathUtils.damp(g.scale.x, scale * (hovered ? 1.14 : 1), 8, dt)
    g.scale.setScalar(s)
    const targetOpen = opened ? -2.5 : hovered ? -0.55 : 0
    hinge.current!.rotation.y = THREE.MathUtils.damp(hinge.current!.rotation.y, targetOpen, 6, dt)
    coverMat.current!.emissiveIntensity = THREE.MathUtils.damp(coverMat.current!.emissiveIntensity, hovered || opened ? 1.6 : 0.55, 6, dt)
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        setOpened(true)
        setTimeout(onActivate, 380)
        setTimeout(() => setOpened(false), 1600)
      }}
    >
      {/* back cover */}
      <mesh position={[0, 0, -T / 2]}>
        <boxGeometry args={[W, H, 0.04]} />
        <meshStandardMaterial color="#1a1220" roughness={0.7} />
      </mesh>
      {/* pages */}
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[W - 0.08, H - 0.1, T - 0.06]} />
        <meshStandardMaterial color="#e9dcc0" emissive={color} emissiveIntensity={opened ? 0.6 : 0.05} roughness={0.9} />
      </mesh>
      {/* spine */}
      <mesh position={[-W / 2, 0, 0]}>
        <boxGeometry args={[0.06, H, T]} />
        <meshStandardMaterial color="#1a1220" roughness={0.6} />
      </mesh>
      {/* front cover on a hinge at the spine */}
      <group ref={hinge} position={[-W / 2, 0, T / 2]}>
        <mesh position={[W / 2, 0, 0]}>
          <boxGeometry args={[W, H, 0.04]} />
          <meshStandardMaterial attach="material-0" color="#1a1220" />
          <meshStandardMaterial attach="material-1" color="#1a1220" />
          <meshStandardMaterial attach="material-2" color="#1a1220" />
          <meshStandardMaterial attach="material-3" color="#1a1220" />
          <meshStandardMaterial ref={coverMat} attach="material-4" map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.55} metalness={0.1} />
          <meshStandardMaterial attach="material-5" color="#d9c9a5" emissive={color} emissiveIntensity={0.35} />
        </mesh>
      </group>
      {/* generous invisible hit area so small books are easy to click */}
      <mesh visible={false}>
        <boxGeometry args={[W * 1.3, H * 1.25, 0.6]} />
      </mesh>
    </group>
  )
}

/* ---------------- Floating skill words on the origin floor ---------------- */
function Words({ words, y, color }: { words: string[]; y: number; color: string }) {
  const group = useRef<THREE.Group>(null)
  const items = useMemo(() => {
    const r = rng('words')
    return words.map((w, i) => ({
      w,
      tex: wordTexture(w, color),
      pos: [Math.cos((i / words.length) * Math.PI * 2) * (2.4 + r() * 1.2), y - 2 + ((i * 7) % words.length) / words.length * 4, Math.sin((i / words.length) * Math.PI * 2) * (2.4 + r() * 1.2)] as [number, number, number],
    }))
  }, [words, y, color])
  useEffect(() => () => items.forEach((i) => i.tex.dispose()), [items])
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.08
  })
  return (
    <group ref={group}>
      {items.map((it) => (
        <sprite key={it.w} position={it.pos} scale={[1.5, 0.375, 1]}>
          <spriteMaterial map={it.tex} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}

/* ---------------- Summoning portal (contact floor) ---------------- */
function Portal({ y, color }: { y: number; color: string }) {
  const tex = useMemo(() => runeCircleTexture('portal'), [])
  useEffect(() => () => tex.dispose(), [tex])
  const ref = useRef<THREE.Mesh>(null)
  const overcharge = useStore((s) => s.overcharge)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    m.lookAt(state.camera.position.x, y, state.camera.position.z)
    m.rotateZ(state.clock.elapsedTime * 0.3)
    const s = THREE.MathUtils.damp(m.scale.x, hovered ? 1.12 : 1, 6, dt)
    m.scale.setScalar(s)
  })
  return (
    <mesh ref={ref} position={[0, y, 0]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={overcharge}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial map={tex} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function FloorContents({ floors, onOpen }: { floors: FloorDef[]; onOpen: (slug: string) => void }) {
  return (
    <>
      {floors.map((f, i) => {
        const y = floorY(i)
        if (f.kind === 'hero')
          return (
            <Book
              key={i}
              title="Vimal Kumar Yadav"
              kicker="The Grimoire of"
              color={f.color}
              seed="hero-vky"
              y={y}
              radius={0}
              angle={0}
              scale={2}
              label="Begin the descent"
              onActivate={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            />
          )
        if (f.kind === 'origin' && f.words) return <Words key={i} words={f.words} y={y} color={f.color} />
        if (f.kind === 'summon') return <Portal key={i} y={y} color={f.color} />
        const list = f.projects ?? []
        const small = f.kind === 'archive'
        return list.map((p, j) => {
          const ring = small && j % 2 === 1
          return (
            <Book
              key={p.slug}
              title={p.name}
              kicker={f.label}
              color={f.color}
              seed={p.slug}
              y={y + (small ? (ring ? 1.2 : -1.0) : 0)}
              radius={small ? (ring ? 3.6 : 2.6) : list.length <= 2 ? 2.2 : list.length > 5 ? 3.7 : 3.1}
              angle={(j / list.length) * Math.PI * 2}
              scale={small ? 0.55 : list.length > 5 ? 0.82 : 1}
              label={p.name}
              onActivate={() => onOpen(p.slug)}
            />
          )
        })
      })}
    </>
  )
}

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (!done.current) {
      done.current = true
      requestAnimationFrame(onReady)
    }
  })
  return null
}

function Invalidator({ paused }: { paused: boolean }) {
  // With frameloop="demand", one more frame after unpausing restarts the loop cleanly.
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [paused, invalidate])
  return null
}

export default function Scene({ floors, onReady }: { floors: FloorDef[]; onReady: () => void }) {
  const [tier, setTier] = useState<Tier>(() => (window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 ? 'high' : 'low'))
  const dialogOpen = useStore((s) => !!s.project || s.paletteOpen)
  const overcharged = useStore((s) => s.overcharged)
  const openProject = useStore((s) => s.openProject)
  const light = useRef<THREE.PointLight>(null)
  const totalH = floors.length * FLOOR_H

  return (
    <Canvas
      className="g-canvas"
      aria-hidden
      dpr={tier === 'high' ? [1, 1.75] : [1, 1.25]}
      // Pause rendering entirely while a dialog covers the scene.
      frameloop={dialogOpen ? 'demand' : 'always'}
      gl={{ antialias: tier === 'low', powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [10, 1.4, 0] }}
    >
      <PerformanceMonitor onDecline={() => setTier('low')} flipflops={2} />
      <Invalidator paused={dialogOpen} />
      <color attach="background" args={['#07060b']} />
      <fog attach="fog" args={['#07060b', 10, 30]} />
      <ambientLight intensity={1.1} color="#8c80b8" />
      <hemisphereLight args={['#7a68b0', '#2a1a10', 1.4]} />
      <pointLight ref={light} intensity={320} distance={34} decay={1.5} />
      <CameraRig floors={floors} light={light} />
      <Tower count={floors.length} tier={tier} />
      <RuneCircles floors={floors} />
      <FloorContents floors={floors} onOpen={openProject} />
      <Sparkles
        count={tier === 'high' ? 420 : 140}
        position={[0, -totalH / 2 + 6, 0]}
        scale={[24, totalH + 12, 24]}
        size={overcharged ? 9 : 3.2}
        speed={overcharged ? 3 : 0.35}
        color="#f3c977"
        opacity={0.8}
      />
      {tier === 'high' && (
        <Suspense fallback={null}>
          <Effects intensity={overcharged ? 2.2 : 0.9} />
        </Suspense>
      )}
      <Ready onReady={onReady} />
    </Canvas>
  )
}
