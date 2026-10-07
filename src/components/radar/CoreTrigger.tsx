import { animate, motion, useTransform } from 'framer-motion'
import { forwardRef, useRef } from 'react'
import { haptic } from '../../lib/haptics'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import { useRadarField } from './RadarFieldContext'

const HOLD_MS = 420
const BASE = 136

/**
 * The core itself is the capture action. Tap opens; holding builds tension
 * (sweep slows, field is pulled inward) and opens on its own after HOLD_MS.
 */
export const CoreTrigger = forwardRef<HTMLButtonElement, { onOpen: () => void; hidden: boolean }>(function CoreTrigger(
  { onOpen, hidden },
  ref
) {
  const { coreX, coreY, coreScale, tension, geometry } = useRadarField()
  const { reduced } = useMotionPreferences()
  const holdTimer = useRef<number | undefined>(undefined)
  const openedByHold = useRef(false)

  const scale = useTransform(coreScale, (s) => Math.min(140, Math.max(76, 2 * geometry.R * s * 0.46)) / BASE)
  // Full label only at home scale; every smaller pose shows the crosshair glyph.
  const labelOpacity = useTransform(coreScale, [0.86, 0.96], [0, 1])
  const glyphOpacity = useTransform(coreScale, [0.84, 0.94], [1, 0])
  const press = useTransform(tension, [0, 1], [1, 0.86])

  const release = () => {
    window.clearTimeout(holdTimer.current)
    if (!openedByHold.current) animate(tension, 0, springs.settle)
  }

  const open = () => {
    window.clearTimeout(holdTimer.current)
    onOpen()
    // Let the tension relax once the aperture has taken over the screen.
    window.setTimeout(() => animate(tension, 0, springs.settle), 260)
  }

  return (
    <motion.div className="core-trigger" style={{ x: coreX, y: coreY, visibility: hidden ? 'hidden' : 'visible' }}>
      <motion.button
        ref={ref}
        type="button"
        className="core-trigger__button"
        style={{ scale }}
        aria-label="Registrar atrito"
        aria-haspopup="dialog"
        aria-describedby="core-trigger-hint"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          openedByHold.current = false
          animate(tension, 1, reduced ? { duration: 0 } : { duration: HOLD_MS / 1000, ease: [0.4, 0, 0.2, 1] })
          holdTimer.current = window.setTimeout(() => {
            openedByHold.current = true
            haptic('snap')
            open()
          }, HOLD_MS)
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onClick={() => {
          if (openedByHold.current) {
            openedByHold.current = false
            return
          }
          open()
        }}
      >
        <motion.span className="core-trigger__ring" style={{ scale: press }} aria-hidden="true" />
        <motion.span className="core-trigger__label" style={{ opacity: labelOpacity }} aria-hidden="true">
          <small>HOLD TO CAPTURE</small>
          <strong>REGISTRAR<br />ATRITO</strong>
        </motion.span>
        <motion.span className="core-trigger__glyph" style={{ opacity: glyphOpacity }} aria-hidden="true" />
      </motion.button>
      <span id="core-trigger-hint" className="sr-only">Toque ou segure o núcleo do radar para abrir a captura.</span>
    </motion.div>
  )
})
