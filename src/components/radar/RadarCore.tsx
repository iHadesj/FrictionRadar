import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { polar } from '../../lib/fieldModel'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { useRadarField } from './RadarFieldContext'
import type { SceneSignals } from './RadarScene'

// Three.js is code-split: the field is complete without it and it never blocks first paint.
const RadarScene = lazy(() => import('./RadarScene'))

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function tickPath(R: number) {
  let d = ''
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * Math.PI * 2
    const inner = R * (i % 6 === 0 ? 0.86 : 0.91)
    const p0 = polar(a, inner)
    const p1 = polar(a, R * 0.96)
    d += `M${p0.x.toFixed(1)},${p0.y.toFixed(1)}L${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
  }
  return d
}

function arcPath(r: number, from: number, to: number) {
  const a = polar(from, r)
  const b = polar(to, r)
  const large = to - from > Math.PI ? 1 : 0
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(1)},${b.y.toFixed(1)}`
}

/** The radar core: SVG instrument rings + scanner, with the WebGL body layered in when enabled. */
export function RadarCore({ covered }: { covered: boolean }) {
  const { geometry, model, coreX, coreY, coreS, tension, pulse, dockProgress } = useRadarField()
  const { show3D, lowPower, reduced, intro } = useMotionPreferences()
  const [sceneFailed, setSceneFailed] = useState(false)
  const use3D = show3D && !sceneFailed
  const R = geometry.R

  const signals = useRef<SceneSignals>({ severity: 0, intensity: 0, tension: 0, pulse: 0, dock: 0, visible: true })
  signals.current.severity = model.severity
  signals.current.intensity = model.avgIntensity
  signals.current.visible = !covered

  useEffect(() => {
    const unsubs = [
      tension.on('change', (v) => (signals.current.tension = v)),
      pulse.on('change', (v) => (signals.current.pulse = v)),
      dockProgress.on('change', (v) => (signals.current.dock = v))
    ]
    return () => unsubs.forEach((u) => u())
  }, [tension, pulse, dockProgress])

  const onSceneFailure = useCallback(() => setSceneFailed(true), [])

  // SVG scanner sweep (used when the 3D body is off). Slows while the core is held.
  const scanRotate = useMotionValue(0)
  useAnimationFrame((_, delta) => {
    if (use3D || reduced || covered) return
    const speed = (360 / 5.2) * (1 + model.severity * 0.9) * (1 - 0.88 * tension.get())
    scanRotate.set((scanRotate.get() + (speed * Math.min(delta, 64)) / 1000) % 360)
  })

  const ticks = useMemo(() => tickPath(R), [R])
  const introScale = intro === 'full' ? 0.32 : intro === 'short' ? 0.86 : 1

  return (
    <motion.div className="core-assembly" style={{ x: coreX, y: coreY, scale: coreS, width: R * 2, height: R * 2, marginLeft: -R, marginTop: -R }}>
      <motion.div
        className="core-assembly__body"
        initial={intro === 'none' ? false : { scale: introScale, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: intro === 'full' ? 0.22 : 0, type: 'spring', stiffness: 170, damping: 22 }}
      >
        {!use3D && (
          <motion.div className="core-scan" style={{ rotate: scanRotate, width: R * 2.5, height: R * 2.5, marginLeft: -R * 1.25, marginTop: -R * 1.25 }} />
        )}
        <svg className="core-rings" viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} aria-hidden="true">
          <path d={ticks} className="core-rings__ticks" />
          <path d={arcPath(R * 0.96, -Math.PI * 0.42, Math.PI * 1.36)} className="core-rings__line" />
          {!use3D && (
            <>
              <path d={arcPath(R * 0.7, Math.PI * 0.1, Math.PI * 1.45)} className="core-rings__danger" style={{ opacity: 0.3 + model.severity * 0.65 }} />
              <circle r={R * 0.46} className="core-rings__line core-rings__line--dim" />
              <circle r={R * 0.2} className="core-rings__line" />
            </>
          )}
          <path d={`M${-R * 0.08},0H${R * 0.08}M0,${-R * 0.08}V${R * 0.08}`} className="core-rings__cross" />
          {model.zones.map((zone) => {
            const tip = polar(zone.angle, R * 0.84)
            const l = polar(zone.angle - 0.06, R * 0.99)
            const r = polar(zone.angle + 0.06, R * 0.99)
            return (
              <path
                key={zone.key}
                d={`M${tip.x.toFixed(1)},${tip.y.toFixed(1)}L${l.x.toFixed(1)},${l.y.toFixed(1)}L${r.x.toFixed(1)},${r.y.toFixed(1)}Z`}
                className="core-rings__zone"
                style={{ opacity: 0.45 + zone.strength * 0.55 }}
              />
            )
          })}
        </svg>
        {use3D && (
          <div className="core-canvas-slot" style={{ width: R * 2.2, height: R * 2.2, marginLeft: -R * 1.1, marginTop: -R * 1.1 }}>
            <SceneBoundary onError={onSceneFailure}>
              <Suspense fallback={null}>
                <RadarScene signals={signals} lowPower={lowPower} reduced={reduced} onFailure={onSceneFailure} />
              </Suspense>
            </SceneBoundary>
          </div>
        )}
      </motion.div>
      {intro === 'full' && (
        <motion.span
          className="intro-dot"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1, 1.6], opacity: [1, 1, 0] }}
          transition={{ duration: 0.52, times: [0, 0.3, 1], ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}
