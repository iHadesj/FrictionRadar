import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { blobPath } from '../../lib/fieldModel'
import { springs } from '../../motion/springs'

interface CraterProps {
  spotKey: string
  /** Diameter, px. */
  size: number
  /** 0..1 share of the top load — drives red presence and wobble. */
  strength: number
}

/**
 * A pressure crater: irregular contour rings around a dense centre. Shares a
 * layoutId between Home (pressure zones) and Patterns (clusters) so the same
 * object carries the user from one section to the other.
 */
export function Crater({ spotKey, size, strength }: CraterProps) {
  const r = size / 2
  const paths = useMemo(
    () => [0.98, 0.72, 0.46].map((f, i) => blobPath(r * f, `${spotKey}-${i}`, 0.08 + strength * 0.1)),
    [r, spotKey, strength]
  )
  return (
    <motion.span
      layoutId={`hotspot-${spotKey}`}
      className="crater"
      style={{ width: size, height: size, ['--crater-heat' as string]: strength.toFixed(2) }}
      transition={springs.settle}
      aria-hidden="true"
    >
      <svg viewBox={`${-r} ${-r} ${size} ${size}`} width={size} height={size}>
        <path d={paths[0]} className="crater__ring" />
        <path d={paths[1]} className="crater__ring crater__ring--hot" />
        <path d={paths[2]} className="crater__ring crater__ring--hot" />
        <circle r={Math.max(2.5, r * 0.14)} className="crater__core" />
      </svg>
    </motion.span>
  )
}
