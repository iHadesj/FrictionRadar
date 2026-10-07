import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useState } from 'react'
import { TrailSegment } from '../../components/radar/Trail'
import { haptic } from '../../lib/haptics'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import type { FrictionEntry } from '../../types'
import { SignalDetails } from './SignalDetails'

export interface StreamSignal {
  key: string
  entry: FrictionEntry
  x: number
  recurrence: number
  ordinal: number
  load: number
}

const NODE_Y = 30
const DISCARD_AT = 110
const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

interface SignalNodeProps {
  signal: StreamSignal
  trail: { top: number; bottom: number; first: boolean; last: boolean }
  open: boolean
  /** -1 / 1 when this row borders the open one — it makes room. */
  neighbour: number
  onToggle: () => void
  onDiscard: () => void
}

export function SignalNode({ signal, trail, open, neighbour, onToggle, onDiscard }: SignalNodeProps) {
  const { entry, x, recurrence, load } = signal
  const { reduced } = useMotionPreferences()
  const [dissolving, setDissolving] = useState(false)
  const dragX = useMotionValue(0)
  const discardOpacity = useTransform(dragX, [-DISCARD_AT, -24, 0], [1, 0.2, 0])
  const stretch = useTransform(dragX, [-DISCARD_AT * 1.4, 0], [1.5, 1])

  const tone = entry.intensity >= 4 ? 'hi' : entry.intensity === 3 ? 'mid' : 'lo'
  const core = 3 + entry.intensity * 1.3
  const halo = Math.min(30, 9 + Math.sqrt(load) * 1.4)
  const echoes = Math.min(recurrence - 1, 3)
  const detailId = `signal-detail-${entry.id}`

  const discard = () => {
    if (dissolving) return
    haptic('discard')
    setDissolving(true)
    window.setTimeout(onDiscard, reduced ? 0 : 320)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -DISCARD_AT || info.velocity.x < -800) discard()
  }

  return (
    <motion.li
      layout="position"
      className={`stream-row tone-${tone}${open ? ' is-open' : ''}`}
      style={{ ['--x' as string]: `${x}%` }}
      animate={{ y: neighbour * (open ? 0 : 6) }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.32, ease: [0.5, 0, 0.75, 0] } }}
      transition={springs.settle}
    >
      <TrailSegment top={trail.top} node={x} bottom={trail.bottom} nodeY={NODE_Y} first={trail.first} last={trail.last} open={open} />
      <motion.span className="discard-zone" style={{ opacity: discardOpacity }} aria-hidden="true">
        ← DESCARTAR
      </motion.span>
      <motion.div
        className="stream-row__body"
        drag={dissolving ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0.08 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
        onDragEnd={onDragEnd}
        style={{ x: dragX }}
      >
        <motion.span className="stream-node" style={{ left: `${x}%`, top: NODE_Y, scaleX: stretch }} aria-hidden="true">
          <svg viewBox="-34 -34 68 68" width={68} height={68}>
            <circle r={halo} className="stream-node__halo" />
            {Array.from({ length: echoes }, (_, i) => (
              <circle key={i} r={core + 5 + i * 4} className="stream-node__echo" />
            ))}
            <circle r={core} className="stream-node__core" />
          </svg>
          {open && <motion.span layoutId="stream-focus" className="stream-node__focus" transition={springs.settle} />}
          {dissolving && !reduced && (
            <span className="stream-node__particles">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ ['--a' as string]: `${i * 40 + 12}deg`, ['--d' as string]: `${18 + (i % 3) * 10}px` }} />
              ))}
            </span>
          )}
        </motion.span>

        <button type="button" className="stream-row__title" onClick={onToggle} aria-expanded={open} aria-controls={detailId}>
          <strong>{entry.title}</strong>
          <span className="stream-row__meta">
            {entry.category} · {entry.context} · {timeFormat.format(new Date(entry.createdAt))}
          </span>
          <span className="stream-row__reading">
            {entry.minutes} MIN · I{entry.intensity}/5{recurrence > 1 ? ` · ${recurrence}× NO RADAR` : ''}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open && <SignalDetails id={detailId} signal={signal} onDiscard={discard} />}
        </AnimatePresence>
      </motion.div>
    </motion.li>
  )
}
