import { motion } from 'framer-motion'
import { ease } from '../../motion/motionTokens'

interface Category {
  name: string
  count: number
  minutes: number
  load: number
}

const BAND_GAP = 58

/** Load by area as topographic strata: thickness and deformation follow each area's share. */
export function CategoryContours({ categories, width }: { categories: Category[]; width: number }) {
  const total = categories.reduce((sum, c) => sum + c.load, 0) || 1
  const maxShare = (categories[0]?.load ?? 0) / total || 1
  const height = 28 + categories.length * BAND_GAP

  return (
    <section className="strata" aria-labelledby="strata-title">
      <span className="eyebrow">03 // LOAD BY AREA</span>
      <h2 id="strata-title">ESTRATOS DE CARGA</h2>
      {categories.length ? (
        <div className="strata__field" style={{ width, height }}>
          <svg width={width} height={height} aria-hidden="true">
            {categories.map((category, index) => {
              const share = category.load / total
              const y = 30 + index * BAND_GAP
              const a = 5 + 16 * (share / maxShare)
              const d = `M0,${y} C${width * 0.28},${y - a} ${width * 0.52},${y + a * 0.7} ${width * 0.74},${y - a * 0.2} S${width * 0.94},${y + a * 0.25} ${width},${y}`
              return (
                <motion.path
                  key={category.name}
                  d={d}
                  className={index === 0 ? 'strata__band is-top' : 'strata__band'}
                  style={{ strokeWidth: 1.5 + 14 * (share / maxShare) }}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: index * 0.06, ease: ease.out }}
                />
              )
            })}
          </svg>
          <ol className="strata__labels">
            {categories.map((category, index) => (
              // Labels ride above their band, clear of its thickness and deformation.
              <li key={category.name} style={{ top: 30 + index * BAND_GAP - 26 - (1.5 + 14 * (category.load / total / maxShare)) / 2 - 6 }}>
                <span>{category.name}</span>
                <strong>
                  {category.load} <small>LOAD · {Math.round((category.load / total) * 100)}%</small>
                </strong>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="field-note">Sem áreas registradas ainda.</p>
      )}
    </section>
  )
}
