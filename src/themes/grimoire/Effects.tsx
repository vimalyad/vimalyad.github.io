import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing'
import { HalfFloatType } from 'three'

/**
 * Bloom + vignette using `postprocessing` directly. The @react-three/postprocessing wrapper
 * drags in an unused SSAO library (~290 KB of source); this keeps the chunk lean.
 * Only loaded on high-tier devices.
 */
export default function Effects({ intensity }: { intensity: number }) {
  const { gl, scene, camera, size } = useThree()
  const [composer, bloom] = useMemo(() => {
    const c = new EffectComposer(gl, { frameBufferType: HalfFloatType })
    c.addPass(new RenderPass(scene, camera))
    const b = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.45, intensity, radius: 0.7 })
    // Rendering through a composer bypasses the renderer's own tone mapping, so apply it here (after bloom)
    // to keep the high tier looking like the low tier.
    c.addPass(new EffectPass(camera, b, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), new VignetteEffect({ offset: 0.3, darkness: 0.7 })))
    return [c, b] as const
  }, [gl, scene, camera])
  useEffect(() => composer.setSize(size.width, size.height), [composer, size])
  useEffect(() => void (bloom.intensity = intensity), [bloom, intensity])
  useEffect(() => () => composer.dispose(), [composer])
  // A positive priority tells R3F we own the render call.
  useFrame((_, dt) => composer.render(dt), 1)
  return null
}
