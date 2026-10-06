import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface RadarSceneProps {
  intensity: number
  lowPower?: boolean
  paused?: boolean
}

export function RadarScene({ intensity, lowPower = false, paused = false }: RadarSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || paused) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.1, 6.5)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !lowPower, powerPreference: 'high-performance' })
    renderer.setClearAlpha(0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.5))
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    group.rotation.x = -0.45
    scene.add(group)

    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xd6ff3f, wireframe: true, transparent: true, opacity: 0.75 })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, lowPower ? 1 : 2), coreMaterial)
    group.add(core)

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd6ff3f, wireframe: true, transparent: true, opacity: 0.22 })
    const dangerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3d2e, wireframe: true, transparent: true, opacity: 0.58 })

    const rings: THREE.Mesh[] = []
    ;[1.45, 1.92, 2.42].forEach((radius, index) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, index === 1 ? 0.022 : 0.014, 5, lowPower ? 48 : 96),
        index === 1 ? dangerMaterial : ringMaterial
      )
      mesh.rotation.x = Math.PI / 2
      group.add(mesh)
      rings.push(mesh)
    })

    const scanner = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 0.035),
      new THREE.MeshBasicMaterial({ color: 0xff3d2e, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    )
    scanner.position.z = 0.05
    group.add(scanner)

    const pointCount = lowPower ? 70 : 150
    const pointsGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(pointCount * 3)
    for (let i = 0; i < pointCount; i += 1) {
      const r = 1.5 + Math.random() * 1.2
      const angle = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.sin(angle) * r
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
    }
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const points = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: 0xd6ff3f, size: 0.028, transparent: true, opacity: 0.6 })
    )
    group.add(points)

    let width = 0
    let height = 0
    const resize = () => {
      width = mount.clientWidth
      height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let frame = 0
    let last = 0
    const targetFps = lowPower ? 28 : 45
    const minDelta = 1000 / targetFps

    const animate = (time: number) => {
      frame = requestAnimationFrame(animate)
      if (document.hidden || time - last < minDelta) return
      last = time

      const severity = Math.min(intensity / 250, 1)
      group.rotation.z += 0.0024 + severity * 0.005
      core.rotation.x += 0.002
      core.rotation.y += 0.0035 + severity * 0.003
      rings[1].rotation.z -= 0.007 + severity * 0.008
      scanner.rotation.z += 0.018 + severity * 0.025
      core.scale.setScalar(0.98 + Math.sin(time * 0.0022) * 0.035 + severity * 0.05)
      dangerMaterial.opacity = 0.28 + severity * 0.58
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      pointsGeometry.dispose()
      core.geometry.dispose()
      rings.forEach((ring) => ring.geometry.dispose())
      scanner.geometry.dispose()
      coreMaterial.dispose()
      ringMaterial.dispose()
      dangerMaterial.dispose()
      ;(scanner.material as THREE.Material).dispose()
      ;(points.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [intensity, lowPower, paused])

  return <div ref={mountRef} className="radar-scene" aria-hidden="true" />
}
