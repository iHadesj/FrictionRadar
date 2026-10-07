import { useEffect, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

/** Live inputs written by React/motion values; read every frame without re-creating the scene. */
export interface SceneSignals {
  /** 0..1 today's load. */
  severity: number
  /** 0..5 average intensity today. */
  intensity: number
  /** 0..1 hold-to-capture tension. */
  tension: number
  /** 0..1 capture pulse. */
  pulse: number
  /** 0..1 how far the core has receded into the dock (camera drift). */
  dock: number
  /** False while covered (capture aperture open) — rendering pauses. */
  visible: boolean
}

interface RadarSceneProps {
  signals: MutableRefObject<SceneSignals>
  lowPower: boolean
  reduced: boolean
  onFailure: () => void
}

const GREEN = 0xd6ff3f
const RED = 0xff3d2e

/**
 * One persistent WebGL canvas for the whole app. It never carries information on
 * its own — every number it reacts to is also rendered as text in the DOM.
 */
export default function RadarScene({ signals, lowPower, reduced, onFailure }: RadarSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !lowPower, powerPreference: lowPower ? 'low-power' : 'high-performance' })
    } catch {
      onFailure()
      return
    }
    renderer.setClearAlpha(0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 1.6))
    renderer.domElement.style.pointerEvents = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
    camera.position.set(0, 0, 6.4)

    const group = new THREE.Group()
    group.rotation.x = -0.5
    scene.add(group)

    // Core: wireframe icosahedron whose vertices are displaced by intensity/pulse.
    const coreGeometry = new THREE.IcosahedronGeometry(0.95, lowPower ? 1 : 2)
    const position = coreGeometry.getAttribute('position') as THREE.BufferAttribute
    const base = Float32Array.from(position.array as Float32Array)
    const coreMaterial = new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.78 })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    group.add(core)

    const ringMaterial = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.26 })
    const dangerMaterial = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.5 })
    const rings = [1.38, 1.76, 2.1].map((radius, index) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 1 ? 0.018 : 0.011, 4, lowPower ? 56 : 96, index === 2 ? Math.PI * 1.55 : Math.PI * 2),
        index === 1 ? dangerMaterial : ringMaterial
      )
      mesh.rotation.x = Math.PI / 2
      group.add(mesh)
      return mesh
    })

    const scannerMaterial = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    const scanner = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.03), scannerMaterial)
    scanner.geometry.translate(1.05, 0, 0)
    scanner.rotation.x = Math.PI / 2
    group.add(scanner)

    const pointCount = lowPower ? 36 : 90
    const pointPositions = new Float32Array(pointCount * 3)
    for (let i = 0; i < pointCount; i += 1) {
      const r = 1.45 + Math.random() * 0.75
      const angle = Math.random() * Math.PI * 2
      pointPositions[i * 3] = Math.cos(angle) * r
      pointPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.25
      pointPositions[i * 3 + 2] = Math.sin(angle) * r
    }
    const pointsGeometry = new THREE.BufferGeometry()
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
    const pointsMaterial = new THREE.PointsMaterial({ color: GREEN, size: 0.035, transparent: true, opacity: 0.55 })
    const points = new THREE.Points(pointsGeometry, pointsMaterial)
    group.add(points)

    const resize = () => {
      const size = mount.clientWidth
      if (!size) return
      renderer.setSize(size, size, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const targetFps = reduced ? 12 : lowPower ? 30 : 50
    const minDelta = 1000 / targetFps
    let frame = 0
    let last = 0
    let clock = 0
    let scanAngle = 0

    const render = (time: number) => {
      frame = requestAnimationFrame(render)
      if (time - last < minDelta) return
      const dt = Math.min(64, time - last)
      last = time
      const s = signals.current
      if (!s.visible) return

      if (!reduced) clock += dt * 0.001
      const severity = s.severity
      const amp = (reduced ? 0.03 : 0.035 + severity * 0.16) + s.pulse * 0.32
      const freq = 2.1 + s.intensity * 0.25
      const arr = position.array as Float32Array
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i]
        const y = base[i + 1]
        const z = base[i + 2]
        const n = Math.sin(x * freq + clock * 1.3) * Math.sin(y * freq * 1.2 + clock * 0.9) * Math.sin(z * freq * 0.9 + clock * 0.7)
        const f = 1 + amp * n
        arr[i] = x * f
        arr[i + 1] = y * f
        arr[i + 2] = z * f
      }
      position.needsUpdate = true

      // Load compresses the core vertically; tension squeezes it further.
      const squash = 1 - severity * 0.1 - s.tension * 0.16
      const breathe = reduced ? 1 : 1 + Math.sin(clock * 1.4) * 0.025
      core.scale.set(breathe * (1 + s.tension * 0.05), breathe * squash, breathe * (1 + s.tension * 0.05))

      if (!reduced) {
        const spin = dt * 0.001
        core.rotation.y += spin * (0.22 + severity * 0.3)
        core.rotation.x += spin * 0.12
        rings[1].rotation.z -= spin * (0.4 + severity * 0.5)
        rings[2].rotation.z += spin * 0.12
        // The sweep slows to a crawl while the core is held.
        scanAngle += spin * (1.2 + severity * 1.4) * (1 - 0.88 * s.tension)
        scanner.rotation.z = scanAngle
      }
      points.scale.setScalar(1 - s.tension * 0.22 + s.pulse * 0.12)
      dangerMaterial.opacity = 0.28 + severity * 0.55 + s.pulse * 0.2
      coreMaterial.opacity = 0.62 + s.pulse * 0.3
      group.rotation.x = -0.5 - s.dock * 0.35
      renderer.render(scene, camera)
    }

    const start = () => {
      cancelAnimationFrame(frame)
      last = 0
      frame = requestAnimationFrame(render)
    }
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame)
      else start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    const onContextLost = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      observer.disconnect()
      coreGeometry.dispose()
      rings.forEach((ring) => ring.geometry.dispose())
      scanner.geometry.dispose()
      pointsGeometry.dispose()
      ;[coreMaterial, ringMaterial, dangerMaterial, scannerMaterial, pointsMaterial].forEach((m) => m.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [lowPower, reduced, signals, onFailure])

  return <div ref={mountRef} className="core-canvas" aria-hidden="true" />
}
