import { motion, type Variants } from 'framer-motion'
import type { summarize } from '../../lib/analytics'
import { ease } from '../../motion/motionTokens'

type Hotspot = ReturnType<typeof summarize>['hotspots'][number]

const textReveal: Variants = {
  hidden: { clipPath: 'inset(0% 100% 0% 0%)' },
  shown: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.6, ease: ease.inOut } }
}
const wireReveal: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: 0.7, delay: 0.25, ease: ease.out } }
}

/** The rule as an editorial annotation on the field, crossed by the signals that prove it. */
export function RecurrenceRule({ hotspots }: { hotspots: Hotspot[] }) {
  const recurring = hotspots.filter((spot) => spot.count >= 3)

  return (
    // The in-view trigger sits on the unclipped wrapper: a fully clipped target never
    // reports as intersecting, so observing the masked text itself would never reveal it.
    <motion.section className="rule" aria-labelledby="rule-title" initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.3 }}>
      <span className="eyebrow eyebrow--friction">04 // RULE</span>
      <motion.h2 id="rule-title" className="rule__text" variants={textReveal}>
        SE REPETIU 3X,
        <br />
        <span>NÃO É AZAR.</span>
      </motion.h2>
      <div className="rule__line" aria-hidden="true">
        <motion.i className="rule__wire" variants={wireReveal} />
        {recurring.map((spot, index) => (
          <span key={spot.title} className="rule__hit" style={{ left: `${14 + index * (70 / Math.max(1, recurring.length))}%` }}>
            {spot.count}×
          </span>
        ))}
      </div>
      <p>
        Transforme recorrência em ação: automatizar, documentar, delegar, mover ou eliminar.
        {recurring.length > 0 && (
          <>
            {' '}
            Agora: <strong>{recurring.map((spot) => spot.title).join(' · ')}</strong>.
          </>
        )}
      </p>
    </motion.section>
  )
}
