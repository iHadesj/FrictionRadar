import { AnimatePresence, motion } from 'framer-motion'

interface TrailSegmentProps {
  /** x (% of row width) where the trail enters at the top of the row. */
  top: number
  /** x (%) of this row's node. */
  node: number
  /** x (%) where the trail leaves at the bottom of the row. */
  bottom: number
  /** Node centre from the top of the row, px. */
  nodeY: number
  first?: boolean
  last?: boolean
  /** Opened rows split the trail into two strands around the revealed detail. */
  open?: boolean
  tone?: 'radar' | 'friction'
}

/**
 * One row's piece of a continuous sinuous trail. Rows stack, so the pieces meet at
 * the row boundaries (midpoints between neighbouring nodes) and read as one line.
 * The lower half stretches with the row, so the trail opens when a row grows.
 */
export function TrailSegment({ top, node, bottom, nodeY, first, last, open, tone = 'radar' }: TrailSegmentProps) {
  return (
    <>
      {!first && (
        <svg className={`trail trail--upper trail--${tone}`} style={{ height: nodeY }} viewBox={`0 0 100 ${nodeY}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={`M${top},0 C${top},${nodeY * 0.55} ${node},${nodeY * 0.45} ${node},${nodeY}`} />
        </svg>
      )}
      {!last && (
        <svg
          className={`trail trail--lower trail--${tone}`}
          // Replaced elements ignore top+bottom stretching, so the height is explicit.
          style={{ top: nodeY, height: `calc(100% - ${nodeY}px)` }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <AnimatePresence initial={false}>
            {open ? (
              <motion.g key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path
                  d={`M${node},0 C${node - 5},18 ${node - 4},80 ${bottom},100`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4 }}
                />
                <motion.path
                  d={`M${node},0 C${node + 6},22 ${node + 5},76 ${bottom},100`}
                  className="trail__strand"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.46 }}
                />
              </motion.g>
            ) : (
              <motion.path key="single" d={`M${node},0 C${node},45 ${bottom},55 ${bottom},100`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            )}
          </AnimatePresence>
        </svg>
      )}
    </>
  )
}
