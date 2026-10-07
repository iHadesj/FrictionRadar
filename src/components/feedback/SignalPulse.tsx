import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ease } from '../../motion/motionTokens'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { useRadarField, type SignalFlight } from '../radar/RadarFieldContext'

/**
 * Confirmation choreography: a red point travels from the transmit control back
 * into the core, then the field answers with a concentric wave.
 */
export function SignalPulse() {
  const { flights, landFlight, waves, geometry } = useRadarField()
  return (
    <svg className="signal-pulse-layer" width={geometry.vp.w} height={geometry.vp.h} aria-hidden="true">
      {flights.map((flight) => (
        <Flight key={flight.id} flight={flight} onLand={landFlight} />
      ))}
      {waves > 0 && <Wave key={waves} />}
    </svg>
  )
}

function Flight({ flight, onLand }: { flight: SignalFlight; onLand: (id: number) => void }) {
  const progress = useMotionValue(0)
  const { from, to } = flight

  const control = useMemo(() => {
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.hypot(dx, dy) || 1
    // Bow the route so the signal visibly travels instead of teleporting.
    return { x: mx - (dy / len) * len * 0.32, y: my + (dx / len) * len * 0.32 }
  }, [from, to])

  const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b
  const cx = useTransform(progress, (t) => quad(from.x, control.x, to.x, t))
  const cy = useTransform(progress, (t) => quad(from.y, control.y, to.y, t))
  const trailOpacity = useTransform(progress, [0, 0.7, 1], [0.9, 0.6, 0])

  useEffect(() => {
    const controls = animate(progress, 1, { duration: 0.62, ease: ease.inOut, onComplete: () => onLand(flight.id) })
    return () => controls.stop()
  }, [progress, onLand, flight.id])

  return (
    <g>
      <motion.path
        d={`M${from.x},${from.y} Q${control.x},${control.y} ${to.x},${to.y}`}
        className="flight-trail"
        style={{ pathLength: progress, opacity: trailOpacity }}
      />
      <motion.circle r={5} cx={cx} cy={cy} className="flight-dot" />
    </g>
  )
}

function Wave() {
  const { getCore } = useRadarField()
  const { reduced } = useMotionPreferences()
  const [core] = useState(getCore)
  const rings = reduced ? [0] : [0, 1, 2]
  return (
    <g>
      {rings.map((i) => (
        <motion.circle
          key={i}
          cx={core.x}
          cy={core.y}
          className="pulse-ring"
          initial={{ r: core.r * 0.4, opacity: 0.85 }}
          animate={reduced ? { opacity: 0 } : { r: core.r * (2.4 + i * 0.6), opacity: 0 }}
          transition={{ duration: reduced ? 0.5 : 0.95, delay: i * 0.12, ease: ease.out }}
        />
      ))}
    </g>
  )
}
