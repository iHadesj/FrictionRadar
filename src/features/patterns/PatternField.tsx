import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { FieldGeometry } from '../../app/geometry'
import type { summarize } from '../../lib/analytics'
import { hotspotKey } from '../../lib/fieldModel'
import { recommendationsFor } from '../../lib/recommendations'
import { ease } from '../../motion/motionTokens'
import { springs } from '../../motion/springs'
import { CategoryContours } from './CategoryContours'
import { HotspotCluster, type ClusterLayout } from './HotspotCluster'
import { layoutLabels } from './labelLayout'
import { RecurrenceRule } from './RecurrenceRule'

type Summary = ReturnType<typeof summarize>

/** Cluster bearings (radians, y down). The top-left quadrant is left free for the title. */
const BEARINGS = [-0.4, 0.8, 2.25, -1.15, 1.55, 2.95, 0.15, 0.45]

interface PatternFieldProps {
  summary: Summary
  geometry: FieldGeometry
  focus: string | null
  onFocus: (key: string | null) => void
}

export function PatternField({ summary, geometry, focus, onFocus }: PatternFieldProps) {
  const { hotspots } = summary
  const width = Math.min(geometry.vp.w, geometry.wide ? 900 : geometry.vp.w)
  const height = geometry.patterns.height
  const cx = width / 2
  const cy = height / 2
  const maxLoad = hotspots[0]?.load || 1
  const focused = hotspots.find((spot) => hotspotKey(spot.title) === focus) ?? null

  // Heavier load → bigger mass, closer to the core, more red, more internal motion.
  const layout = useMemo<ClusterLayout[]>(() => {
    const reach = Math.min(cx, cy) - 40
    return hotspots.map((spot, index) => {
      const key = hotspotKey(spot.title)
      const strength = spot.load / maxLoad
      const angle = BEARINGS[index % BEARINGS.length]
      const distance = 70 + (1 - strength) * (reach - 70) * 0.92 + (index % 2) * 8
      const size = Math.round(30 + 50 * Math.sqrt(strength))
      // Horizontal spread is tighter than vertical so readings stay on screen.
      return { key, spot, strength, size, home: { x: cx + Math.cos(angle) * distance * 0.8, y: cy + Math.sin(angle) * distance } }
    })
  }, [hotspots, maxLoad, cx, cy])

  const positioned = layout.map((item) => {
    if (!focused) return { ...item, at: item.home }
    if (item.key === focus) return { ...item, at: { x: cx, y: cy } }
    // Others step back to make room around the focused cluster.
    const dx = item.home.x - cx
    const dy = item.home.y - cy
    const len = Math.hypot(dx, dy) || 1
    const push = Math.min(len * 1.35, Math.min(cx, cy) - 24)
    return { ...item, at: { x: cx + (dx / len) * push, y: cy + (dy / len) * push } }
  })

  const titleBlock = { x: 0, y: 0, w: Math.min(width * 0.62, 260), h: geometry.wide ? 170 : Math.min(width * 0.13, 100) * 1.75 }
  const labels = layoutLabels(positioned, { width, height, cx }, titleBlock)

  return (
    <div className="patterns" style={{ paddingTop: geometry.patterns.top }}>
      <section className="pattern-field" style={{ height, width }} aria-labelledby="patterns-title">
        <h1 id="patterns-title" className="pattern-field__title">
          PADRÕES
          <br />
          <span>DE ATRITO.</span>
        </h1>
        <svg className="pattern-field__links" width={width} height={height} aria-hidden="true">
          {[0.28, 0.5, 0.74].map((f) => (
            <ellipse key={f} cx={cx} cy={cy} rx={Math.min(cx, cy) * f * 1.25} ry={Math.min(cx, cy) * f * 1.12} className="pattern-field__orbit" />
          ))}
          {positioned.map((item, index) => {
            const neighbour = positioned[(index + 1) % positioned.length]
            const label = labels[index]
            const anchorX = label.align === 'right' ? label.x - 2 : label.align === 'left' ? label.x + label.w + 2 : label.x + label.w / 2
            return (
              <g key={item.key}>
                {!focused && (
                  <path
                    d={`M${item.at.x},${item.at.y} L${anchorX},${label.y + 9}`}
                    className="pattern-field__label-leader"
                  />
                )}
                <motion.line
                  initial={false}
                  animate={{ x1: cx, y1: cy, x2: item.at.x, y2: item.at.y }}
                  transition={springs.settle}
                  className="pattern-field__link"
                  style={{ opacity: 0.18 + item.strength * 0.5 }}
                />
                {positioned.length > 2 && (
                  <motion.line
                    initial={false}
                    animate={{ x1: item.at.x, y1: item.at.y, x2: neighbour.at.x, y2: neighbour.at.y }}
                    transition={springs.settle}
                    className="pattern-field__link pattern-field__link--mesh"
                  />
                )}
              </g>
            )
          })}
        </svg>

        {positioned.map((item, index) => (
          <HotspotCluster
            key={item.key}
            item={item}
            at={item.at}
            index={index}
            focused={item.key === focus}
            dimmed={Boolean(focused) && item.key !== focus}
            label={labels[index]}
            onSelect={() => onFocus(item.key === focus ? null : item.key)}
          />
        ))}

        {!hotspots.length && <p className="field-note pattern-field__empty">AINDA SEM PADRÕES. Registre alguns atritos para o campo formar clusters.</p>}
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {focused && (
          <motion.section
            key={hotspotKey(focused.title)}
            className="cluster-reading"
            aria-live="polite"
            initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.42, ease: ease.out }}
          >
            <span className="eyebrow">FOCO // ALVO DE ELIMINAÇÃO</span>
            <h2>{focused.title}</h2>
            <p className="cluster-reading__numbers">
              <span>
                <b>{focused.count}</b> OCORRÊNCIAS
              </span>
              <span>
                <b>{focused.minutes}</b> MIN
              </span>
              <span>
                <b>{focused.load}</b> CARGA
              </span>
              <span>
                <b>{focused.avgIntensity.toFixed(1).replace('.', ',')}</b> INT. MÉDIA
              </span>
            </p>
            <ol className="cluster-reading__actions">
              {recommendationsFor(focused).map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
            <button type="button" className="command-link" onClick={() => onFocus(null)}>
              <span aria-hidden="true">&gt;</span> SOLTAR FOCO
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {!focused && hotspots.length > 0 && (
        <p className="pattern-hint">Toque num cluster para trazê-lo ao centro e ver recomendações.</p>
      )}

      <CategoryContours categories={summary.topCategories} width={Math.min(geometry.vp.w - 32, 560)} />
      <RecurrenceRule hotspots={hotspots} />
    </div>
  )
}
