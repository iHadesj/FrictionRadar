import { motion, type MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { buildContours, polar, ringFactor } from '../../lib/fieldModel'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { useRadarField } from './RadarFieldContext'

/**
 * Topographic contours of the field. Geometry is recomputed only when data changes;
 * movement is a single transform attribute on one group, batched per frame.
 */
export function RadarContours() {
  const { geometry, model, coreX, coreY, coreS, tension, pulse } = useRadarField()
  const { lowPower, intro } = useMotionPreferences()
  const groupRef = useRef<SVGGElement | null>(null)

  const rings = useMemo(() => {
    const indices = lowPower ? [0, 1, 2, 3, 5, 7, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    return buildContours(geometry.R, model, indices, lowPower ? 40 : 56)
  }, [geometry.R, model, lowPower])

  useTransformAttribute(groupRef, coreX, coreY, coreS, tension, pulse)

  const drawn = intro !== 'none'
  const drawDuration = intro === 'full' ? 0.6 : 0.24

  return (
    <svg className="field-contours" width={geometry.vp.w} height={geometry.vp.h} aria-hidden="true">
      <defs>
        <radialGradient id="zone-glow">
          <stop offset="0%" stopColor="var(--friction)" stopOpacity="0.32" />
          <stop offset="55%" stopColor="var(--friction)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--friction)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={groupRef}>
        {model.zones.map((zone) => {
          const p = polar(zone.angle, geometry.R * ringFactor(1))
          return <circle key={zone.key} cx={p.x} cy={p.y} r={geometry.R * (0.45 + zone.strength * 0.6)} fill="url(#zone-glow)" />
        })}
        {rings.map((ring) => {
          const dashed = ring.index === 4 || ring.index === 8
          const opacity = Math.max(0.1, 0.42 - ring.index * 0.032)
          return dashed || !drawn ? (
            <path
              key={ring.index}
              d={ring.d}
              className={dashed ? 'contour contour--dashed' : 'contour'}
              style={{ opacity }}
            />
          ) : (
            <motion.path
              key={ring.index}
              d={ring.d}
              className="contour"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity }}
              transition={{ duration: drawDuration, delay: 0.12 + ring.index * 0.03, ease: [0.65, 0, 0.35, 1] }}
            />
          )
        })}
        {rings.flatMap((ring) =>
          ring.arcs.map((arc, index) => (
            <path key={`${ring.index}-${index}`} d={arc.d} className="contour contour--pressure" style={{ opacity: Math.max(0.15, arc.strength) }} />
          ))
        )}
      </g>
    </svg>
  )
}

/** Writes `translate() scale()` on an SVG group whenever any input moves, at most once per frame. */
function useTransformAttribute(
  ref: RefObject<SVGGElement | null>,
  x: MotionValue<number>,
  y: MotionValue<number>,
  s: MotionValue<number>,
  tension: MotionValue<number>,
  pulse: MotionValue<number>
) {
  useEffect(() => {
    let frame = 0
    const write = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      // Contours follow the core with a softened scale; tension pulls the field inward.
      const scale = Math.sqrt(s.get()) * (1 - 0.05 * tension.get()) * (1 + 0.035 * pulse.get())
      el.setAttribute('transform', `translate(${x.get().toFixed(1)} ${y.get().toFixed(1)}) scale(${scale.toFixed(4)})`)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write)
    }
    write()
    const unsubs = [x, y, s, tension, pulse].map((mv) => mv.on('change', schedule))
    return () => {
      cancelAnimationFrame(frame)
      unsubs.forEach((u) => u())
    }
  }, [ref, x, y, s, tension, pulse])
}
