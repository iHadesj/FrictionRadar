import { motion } from 'framer-motion'
import { ease } from '../../motion/motionTokens'
import type { IntroMode } from '../../motion/useMotionPreferences'

/** FRICTION / RADAR — an asymmetric scope with a friction slash; type revealed by mask on entry. */
export function BrandMark({ intro, compact }: { intro: IntroMode; compact?: boolean }) {
  return (
    <div className={compact ? 'brand-mark is-compact' : 'brand-mark'} role="img" aria-label="Friction Radar">
      <svg className="brand-mark__scope" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M33.5 13.5 A16 16 0 1 0 35 23" className="brand-mark__arc" />
        <circle cx="20" cy="20" r="8.5" className="brand-mark__arc brand-mark__arc--inner" />
        <circle cx="27.5" cy="11.5" r="2.6" className="brand-mark__dot" />
        <path d="M6 34 L36 6" className="brand-mark__slash" />
      </svg>
      <motion.span
        className="brand-mark__type"
        initial={intro === 'none' ? false : { clipPath: 'inset(0% 100% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={{ delay: intro === 'full' ? 0.3 : 0, duration: intro === 'full' ? 0.42 : 0.2, ease: ease.out }}
        aria-hidden="true"
      >
        <strong>FRICTION</strong>
        <em>/ RADAR</em>
      </motion.span>
    </div>
  )
}
