import { motion } from 'framer-motion'
import { springs } from '../../motion/springs'

/**
 * Options as nodes on a short curved band. The chosen node moves onto the main
 * route (first position, shared marker) and the others redistribute behind it.
 */
export function OrbitSelector<T extends string>({
  name,
  label,
  options,
  value,
  onChange
}: {
  name: string
  label: string
  options: readonly T[]
  value: T
  onChange: (next: T) => void
}) {
  const ordered = [value, ...options.filter((option) => option !== value)]
  return (
    <div className="orbit" role="group" aria-label={label}>
      <span className="orbit__label" aria-hidden="true">
        {label}
      </span>
      <div className="orbit__band">
        {ordered.map((option, index) => {
          const selected = option === value
          // Nodes ride a gentle arc: offset grows then falls along the band.
          const lift = Math.round(Math.sin((index / Math.max(1, ordered.length - 1)) * Math.PI) * -10)
          return (
            <motion.button
              key={option}
              layout
              type="button"
              className={selected ? 'orbit__node is-selected' : 'orbit__node'}
              style={{ marginTop: 10 + lift }}
              aria-pressed={selected}
              onClick={() => onChange(option)}
              transition={springs.settle}
            >
              {selected && <motion.span layoutId={`${name}-marker`} className="orbit__marker" transition={springs.settle} aria-hidden="true" />}
              {option}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
