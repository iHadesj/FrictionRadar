import { AnimatePresence, motion, useTransform } from 'framer-motion'
import { useState } from 'react'
import { polar } from '../../lib/fieldModel'
import { ease } from '../../motion/motionTokens'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { useRadarField } from './RadarFieldContext'

export interface RadarMetric {
  id: string
  label: string
  value: string
  context: string
  /** Radians around the core. */
  angle: number
  tone?: 'radar' | 'friction'
}

/**
 * Metrics as orbital markers tied to the core by leader lines. They live in the
 * core's coordinate space, so they travel, scale and recede with it.
 */
export function RadarMetricNodes({ metrics }: { metrics: RadarMetric[] }) {
  const { geometry, coreX, coreY, coreS, dockProgress } = useRadarField()
  const { intro } = useMotionPreferences()
  const [openId, setOpenId] = useState<string | null>(null)
  const R = geometry.R

  const opacity = useTransform(dockProgress, [0, 0.35], [1, 0])
  const visibility = useTransform(dockProgress, (p) => (p > 0.4 ? 'hidden' : 'visible'))

  const delay = intro === 'full' ? 0.5 : intro === 'short' ? 0.06 : 0
  // On narrow screens a left-side reading would cross the viewport edge: slide it
  // (and its leader end) inward so the label always starts inside the gutter.
  const home = geometry.poses.radar
  const shiftFor = (kneeX: number) => Math.max(0, 16 + 104 - (home.x + kneeX - 10))

  return (
    <motion.div className="metric-orbit" style={{ x: coreX, y: coreY, scale: coreS, opacity, visibility }}>
      <svg className="metric-orbit__leaders" aria-hidden="true">
        {metrics.map((metric, index) => {
          const ring = polar(metric.angle, R * 0.98)
          const knee = polar(metric.angle, R + 22)
          const end = { x: knee.x - 6 + shiftFor(knee.x), y: knee.y }
          return (
            <motion.path
              key={metric.id}
              d={`M${ring.x},${ring.y} Q${knee.x + 4},${knee.y} ${end.x},${end.y}`}
              className={metric.tone === 'friction' ? 'leader leader--friction' : 'leader'}
              initial={intro === 'none' ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: delay + index * 0.05, duration: 0.32, ease: ease.out }}
            />
          )
        })}
      </svg>
      {metrics.map((metric, index) => {
        const knee = polar(metric.angle, R + 22)
        const open = openId === metric.id
        return (
          <motion.button
            key={metric.id}
            type="button"
            className={`metric-node${metric.tone === 'friction' ? ' metric-node--friction' : ''}${open ? ' is-open' : ''}`}
            style={{ top: knee.y - 26, right: -(knee.x - 10 + shiftFor(knee.x)) }}
            aria-expanded={open}
            aria-describedby={`metric-${metric.id}-context`}
            onClick={() => setOpenId(open ? null : metric.id)}
            initial={intro === 'none' ? false : { x: -knee.x * 0.6, y: -knee.y * 0.6, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ ...springs.settle, delay: delay + index * 0.04 }}
          >
            <span className="metric-node__label">{metric.label} //</span>
            <strong className="metric-node__value">{metric.value}</strong>
            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  className="metric-node__context"
                  initial={{ clipPath: 'inset(0% 0% 0% 100%)', opacity: 0 }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
                  exit={{ clipPath: 'inset(0% 0% 0% 100%)', opacity: 0 }}
                  transition={{ duration: 0.28, ease: ease.out }}
                  aria-hidden="true"
                >
                  {metric.context}
                </motion.span>
              )}
            </AnimatePresence>
            <span id={`metric-${metric.id}-context`} className="sr-only">{metric.context}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
