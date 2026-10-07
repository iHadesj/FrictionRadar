import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, type PointerEvent } from 'react'
import { haptic } from '../../lib/haptics'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

type Level = 1 | 2 | 3 | 4 | 5

export const INTENSITY_WORD = ['', 'LEVE', 'BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA'] as const

const W = 300
const H = 72

function wave(a: number) {
  const amp = 3 + a * 5.4
  const cycles = 2.4 + a * 0.9
  let d = `M0,${H / 2}`
  for (let x = 6; x <= W; x += 6) {
    const t = x / W
    // Envelope swells toward the right so the wave reads as rising pressure.
    const env = 0.35 + 0.65 * t
    d += ` L${x},${(H / 2 - Math.sin(t * Math.PI * 2 * cycles) * amp * env).toFixed(1)}`
  }
  return d
}

/** Intensity as a wave whose amplitude grows; drag across it or use the 1–5 controls. */
export function IntensityWave({ value, onChange }: { value: Level; onChange: (next: Level) => void }) {
  const { reduced } = useMotionPreferences()
  const amp = useMotionValue(value)
  const surface = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const controls = animate(amp, value, reduced ? { duration: 0 } : springs.gesture)
    return () => controls.stop()
  }, [value, reduced, amp])

  const d = useTransform(amp, wave)
  const heat = useTransform(amp, (a) => (a / 5) * W)

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = surface.current?.getBoundingClientRect()
    if (!rect) return
    const level = Math.min(5, Math.max(1, Math.ceil(((event.clientX - rect.left) / rect.width) * 5))) as Level
    if (level !== value) {
      haptic('step')
      onChange(level)
    }
  }

  return (
    <div className="intensity">
      <div
        ref={surface}
        className="intensity__surface"
        aria-hidden="true"
        onPointerDown={(event) => {
          dragging.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          fromPointer(event)
        }}
        onPointerMove={(event) => dragging.current && fromPointer(event)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <clipPath id="intensity-heat">
              <motion.rect x={0} y={0} height={H} width={heat} />
            </clipPath>
          </defs>
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="intensity__axis" />
          <motion.path d={d} className="intensity__wave" />
          <motion.path d={d} className="intensity__wave intensity__wave--hot" clipPath="url(#intensity-heat)" />
        </svg>
      </div>
      <div className="intensity__levels" role="group" aria-label="Intensidade do atrito, de 1 a 5">
        {([1, 2, 3, 4, 5] as Level[]).map((level) => (
          <button
            key={level}
            type="button"
            className={level <= value ? 'intensity__level is-on' : 'intensity__level'}
            aria-pressed={level === value}
            aria-label={`Intensidade ${level}, ${INTENSITY_WORD[level].toLowerCase()}`}
            onClick={() => {
              haptic('step')
              onChange(level)
            }}
          >
            {level}
          </button>
        ))}
        <span className="intensity__word" aria-hidden="true">
          {String(value).padStart(2, '0')} // {INTENSITY_WORD[value]}
        </span>
      </div>
    </div>
  )
}
