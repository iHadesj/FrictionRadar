import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

const MIN = 1
const MAX = 240
const PRESETS = [2, 5, 15, 30, 60]
const CX = 80
const CY = 74
const R = 62

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v)))
/** sqrt scale: fine control for the common 1–30 min range, still reaches 4h. */
const toFraction = (m: number) => Math.sqrt((m - MIN) / (MAX - MIN))
const pointAt = (f: number) => {
  const a = Math.PI + f * Math.PI
  return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R }
}
const ARC = `M${CX - R},${CY} A${R},${R} 0 0 1 ${CX + R},${CY}`

/** Minutes lost as a temporal arc: drag horizontally to grow/retract it; numeric input as fallback. */
export function TimeArc({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const { reduced } = useMotionPreferences()
  const inputId = useId()
  const fraction = useMotionValue(toFraction(value))
  const panStart = useRef(value)

  useEffect(() => {
    const controls = animate(fraction, toFraction(value), reduced ? { duration: 0 } : springs.gesture)
    return () => controls.stop()
  }, [value, reduced, fraction])

  const knobX = useTransform(fraction, (f) => pointAt(f).x)
  const knobY = useTransform(fraction, (f) => pointAt(f).y)

  const onPan = (_: unknown, info: PanInfo) => {
    // Resistance grows with the value so long durations need a longer drag.
    const start = toFraction(panStart.current)
    const f = Math.min(1, Math.max(0, start + info.offset.x / 420))
    const next = clamp(MIN + f * f * (MAX - MIN))
    if (next !== value) onChange(next)
  }

  return (
    <div className="time-arc">
      <motion.div
        className="time-arc__dial"
        onPanStart={() => (panStart.current = value)}
        onPan={onPan}
        style={{ touchAction: 'pan-y' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 160 84">
          <path d={ARC} className="time-arc__track" />
          <motion.path d={ARC} className="time-arc__value" style={{ pathLength: fraction }} />
          {PRESETS.map((m) => {
            const p = pointAt(toFraction(m))
            return <circle key={m} cx={p.x} cy={p.y} r={1.6} className="time-arc__tick" />
          })}
          <motion.circle cx={knobX} cy={knobY} r={7} className="time-arc__knob" />
          <text x={CX} y={CY - 14} className="time-arc__value-text">
            {value}
          </text>
          <text x={CX} y={CY + 2} className="time-arc__unit">
            MIN PERDIDOS
          </text>
        </svg>
        <span className="time-arc__drag-hint">← ARRASTE →</span>
      </motion.div>
      <div className="time-arc__controls">
        <div className="time-arc__presets" role="group" aria-label="Atalhos de minutos">
          {PRESETS.map((m) => (
            <button key={m} type="button" className={m === value ? 'time-arc__preset is-on' : 'time-arc__preset'} aria-pressed={m === value} onClick={() => onChange(m)}>
              {m}
            </button>
          ))}
        </div>
        <label className="time-arc__input" htmlFor={inputId}>
          <span>MINUTOS</span>
          <input
            id={inputId}
            type="number"
            min={MIN}
            max={MAX}
            inputMode="numeric"
            value={value}
            onChange={(event) => onChange(clamp(Number(event.target.value) || MIN))}
          />
        </label>
      </div>
    </div>
  )
}
