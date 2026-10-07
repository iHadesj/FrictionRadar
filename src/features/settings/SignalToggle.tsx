import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useId } from 'react'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

const P0 = { x: 7, y: 27 }
const P1 = { x: 33, y: 1 }
const P2 = { x: 59, y: 27 }

const quad = (t: number) => ({
  x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
  y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y
})

/** Two-position selector on a curved signal rail. Native checkbox (role=switch) underneath. */
export function SignalToggle({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const { reduced } = useMotionPreferences()
  const id = useId()
  const progress = useMotionValue(checked ? 1 : 0)

  useEffect(() => {
    const controls = animate(progress, checked ? 1 : 0, reduced ? { duration: 0 } : springs.snap)
    return () => controls.stop()
  }, [checked, reduced, progress])

  const cx = useTransform(progress, (t) => quad(t).x)
  const cy = useTransform(progress, (t) => quad(t).y)
  const trace = useTransform(progress, (t) => {
    const q = { x: P0.x + (P1.x - P0.x) * t, y: P0.y + (P1.y - P0.y) * t }
    const p = quad(t)
    return `M${P0.x},${P0.y} Q${q.x},${q.y} ${p.x},${p.y}`
  })

  return (
    <label className={checked ? 'signal-toggle is-on' : 'signal-toggle'} htmlFor={id}>
      <span className="signal-toggle__text">
        <strong>{label}</strong>
        {hint && <small id={`${id}-hint`}>{hint}</small>}
      </span>
      <span className="signal-toggle__control">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="signal-toggle__input"
          checked={checked}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <svg viewBox="0 0 66 34" width={66} height={34} aria-hidden="true">
          <path d={`M${P0.x},${P0.y} Q${P1.x},${P1.y} ${P2.x},${P2.y}`} className="signal-toggle__rail" />
          <motion.path d={trace} className="signal-toggle__trace" />
          <circle cx={P0.x} cy={P0.y} r={2} className="signal-toggle__stop" />
          <circle cx={P2.x} cy={P2.y} r={2} className="signal-toggle__stop" />
          <motion.circle cx={cx} cy={cy} r={6} className="signal-toggle__node" />
        </svg>
        <span className="signal-toggle__state" aria-hidden="true">
          {checked ? 'ON' : 'OFF'}
        </span>
      </span>
    </label>
  )
}
