import { AnimatePresence, motion, useTransform } from 'framer-motion'
import { TOP_H } from '../../app/geometry'
import { ease } from '../../motion/motionTokens'
import { useRadarField } from '../radar/RadarFieldContext'

const WIDTH = 260

/** Short technical readout that appears beside the core and dissolves — replaces toasts. */
export function SystemReadout() {
  const { readout, dismissReadout, coreX, coreY, coreS, geometry } = useRadarField()
  const { w, safeTop } = geometry.vp

  const x = useTransform(coreX, (cx) => Math.min(w - 16 - WIDTH, Math.max(16, cx - WIDTH * 0.62)))
  // Above the core when there is room, otherwise just below it — never under the top layer.
  const y = useTransform([coreY, coreS], ([cy, s]: number[]) => {
    const r = geometry.R * 0.96 * s
    const above = cy - r - 46
    return above >= safeTop + TOP_H + 6 ? above : cy + r + 10
  })

  return (
    <>
      <motion.div className="readout-anchor" style={{ x, y, width: WIDTH }}>
        <AnimatePresence mode="wait">
          {readout && (
            <motion.div
              key={readout.id}
              className={`readout readout--${readout.tone}`}
              initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
              animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ opacity: 0, letterSpacing: '0.2em', transition: { duration: 0.36, ease: ease.dissolve } }}
              transition={{ duration: 0.34, ease: ease.out }}
            >
              <i className="readout__dot" aria-hidden="true" />
              <span className="readout__text">{readout.text}</span>
              {readout.action && (
                <button
                  type="button"
                  className="readout__action"
                  onClick={() => {
                    readout.action?.run()
                    dismissReadout()
                  }}
                >
                  {readout.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="sr-only" role="status" aria-live="polite">
        {readout?.text ?? ''}
      </div>
    </>
  )
}
