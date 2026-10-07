import { motion } from 'framer-motion'
import type { FieldGeometry } from '../../app/geometry'
import type { summarize } from '../../lib/analytics'
import { polar, ZONE_ANGLES } from '../../lib/fieldModel'
import { ease } from '../../motion/motionTokens'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { PressureZones } from './PressureZones'

type Summary = ReturnType<typeof summarize>

interface RadarHomeProps {
  summary: Summary
  insight: string
  geometry: FieldGeometry
  onOpenHotspot: (key: string) => void
  onShowPatterns: () => void
}

/**
 * Home is one spatial composition around the core: title crossing the field, metrics
 * orbiting (rendered with the core), a readout tied to the strongest pressure zone.
 */
export function RadarHome({ summary, insight, geometry, onOpenHotspot, onShowPatterns }: RadarHomeProps) {
  const { intro, reduced } = useMotionPreferences()
  const pose = geometry.poses.radar
  const R = geometry.R
  const zone = polar(ZONE_ANGLES[0], R * 0.98)
  const leaderStart = { x: pose.x + zone.x, y: pose.y + zone.y }
  const insightTop = geometry.home.insightTop
  const leaderEnd = { x: 30, y: insightTop - 8 }
  const stageHeight = Math.max(geometry.vp.h, insightTop + 230)
  const hasHotspot = summary.hotspots.length > 0
  const delay = intro === 'full' ? 0.35 : 0

  return (
    <div className="home">
      <section className="home-stage" style={{ height: stageHeight }} aria-labelledby="home-title">
        <h1 id="home-title" className="home-title" style={{ top: geometry.home.titleTop }}>
          <span className="sr-only">Encontre o atrito.</span>
          <span className="home-title__line" aria-hidden="true">ENCONTRE O</span>
          <span className="home-title__cut" aria-hidden="true">
            <span className="home-title__outline">ATRITO.</span>
            <motion.span
              className="home-title__fill"
              initial={intro === 'none' ? false : { clipPath: 'inset(0% 0% 100% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 47% 0%)' }}
              transition={{ delay, duration: 0.5, ease: ease.inOut }}
            >
              ATRITO.
            </motion.span>
            <motion.i
              className="home-title__scan"
              initial={intro === 'none' ? false : { top: '0%', scaleX: 0.2 }}
              animate={{ top: '53%', scaleX: 1 }}
              transition={{ delay, duration: 0.5, ease: ease.inOut }}
            />
          </span>
        </h1>
        <p className="home-lede" style={{ top: geometry.home.titleTop + (geometry.wide ? 238 : 122) }}>
          Registre o que interrompe, repete ou rouba minutos.
        </p>

        <svg className="home-leader" width={geometry.vp.w} height={stageHeight} aria-hidden="true">
          <motion.path
            d={`M${leaderStart.x},${leaderStart.y} C${leaderStart.x - 30},${leaderStart.y + 50} ${leaderEnd.x + 40},${leaderEnd.y - 50} ${leaderEnd.x},${leaderEnd.y}`}
            className={hasHotspot ? 'home-leader__path is-hot' : 'home-leader__path'}
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.55, ease: ease.out }}
          />
          <circle cx={leaderStart.x} cy={leaderStart.y} r={3} className={hasHotspot ? 'home-leader__origin is-hot' : 'home-leader__origin'} />
        </svg>

        <motion.div
          className="readout-annotation"
          style={{ top: insightTop, maxWidth: geometry.wide ? 420 : Math.min(330, geometry.vp.w - 32) }}
          initial={reduced ? false : { clipPath: 'inset(0% 100% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ delay: delay + 0.45, duration: 0.5, ease: ease.out }}
        >
          <span className="readout-annotation__index">01 // READOUT</span>
          <p className="readout-annotation__text">
            <span aria-hidden="true">└─ </span>
            {insight}
          </p>
        </motion.div>

        <a className="stage-cue" href="#zones" style={{ top: Math.max(insightTop + 150, geometry.rail.top - 44) }}>
          <span aria-hidden="true">↓</span> 02 // ZONAS DE PRESSÃO
        </a>
      </section>

      <PressureZones hotspots={summary.hotspots} onOpen={onOpenHotspot} onShowPatterns={onShowPatterns} />
    </div>
  )
}
