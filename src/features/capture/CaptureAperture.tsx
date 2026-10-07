import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import type { Point } from '../../app/geometry'
import type { NewFriction } from '../../app/useFrictionStore'
import { useRadarField } from '../../components/radar/RadarFieldContext'
import { ease } from '../../motion/motionTokens'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import type { FrictionEntry } from '../../types'
import { SignalRouteForm } from './SignalRouteForm'

interface CaptureApertureProps {
  open: boolean
  recent: FrictionEntry[]
  nextId: number
  returnFocus: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onTransmit: (entry: NewFriction, from: Point) => Promise<void>
  /** Fires once the aperture fully covers (true) or has fully closed (false). */
  onSettled: (covering: boolean) => void
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The core opens into the capture surface: an iris grows from the core's exact
 * position and radius, and closes back into it when the signal is transmitted.
 */
export function CaptureAperture({ open, recent, nextId, returnFocus, onClose, onTransmit, onSettled }: CaptureApertureProps) {
  const { getCore, geometry } = useRadarField()
  const { reduced } = useMotionPreferences()
  const origin = useRef(getCore())
  const wasOpen = useRef(false)
  if (open && !wasOpen.current) origin.current = getCore()
  wasOpen.current = open

  const { x, y, r } = origin.current
  const reach = Math.hypot(Math.max(x, geometry.vp.w - x), Math.max(y, geometry.vp.h - y)) + 24

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence
      onExitComplete={() => {
        onSettled(false)
        returnFocus.current?.focus({ preventScroll: true })
      }}
    >
      {open && (
        <motion.div
          className="aperture"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aperture-title"
          onKeyDown={trapFocus}
          variants={{
            closed: reduced ? { opacity: 0 } : { clipPath: `circle(${r}px at ${x}px ${y}px)` },
            open: reduced
              ? { opacity: 1, transition: { duration: 0.12 } }
              : { clipPath: `circle(${reach}px at ${x}px ${y}px)`, transition: { duration: 0.56, ease: ease.out } },
            collapse: reduced
              ? { opacity: 0, transition: { duration: 0.12 } }
              : { clipPath: `circle(${r * 0.5}px at ${x}px ${y}px)`, transition: { duration: 0.4, ease: ease.inOut } }
          }}
          initial="closed"
          animate="open"
          exit="collapse"
          onAnimationComplete={(definition) => {
            if (definition === 'open') onSettled(true)
          }}
        >
          <ApertureField origin={origin.current} reduced={reduced} />
          <div className="aperture__scroll">
            <SignalRouteForm recent={recent} nextId={nextId} onClose={onClose} onTransmit={onTransmit} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Rings centred on the core's old position, pulled inward as the aperture opens. */
function ApertureField({ origin, reduced }: { origin: { x: number; y: number; r: number }; reduced: boolean }) {
  return (
    <svg className="aperture__field" aria-hidden="true">
      <g transform={`translate(${origin.x} ${origin.y})`}>
        {[1.2, 1.9, 2.8, 4, 5.6, 7.6].map((f, i) => (
          <motion.circle
            key={f}
            r={Math.max(origin.r, 40) * f}
            className={i === 1 ? 'aperture__ring is-hot' : 'aperture__ring'}
            initial={reduced ? false : { scale: 1.35, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: ease.out }}
          />
        ))}
      </g>
    </svg>
  )
}
