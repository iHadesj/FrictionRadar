import type { summarize } from '../../lib/analytics'
import { hotspotKey } from '../../lib/fieldModel'
import { Crater } from '../../components/radar/Crater'
import { TrailSegment } from '../../components/radar/Trail'

type Hotspot = ReturnType<typeof summarize>['hotspots'][number]

const TRAIL_X = [12, 34, 18, 44, 24]
const NODE_Y = 40

/** Hotspots as pressure craters strung along a trail — tapping one carries it into Patterns. */
export function PressureZones({
  hotspots,
  onOpen,
  onShowPatterns
}: {
  hotspots: Hotspot[]
  onOpen: (key: string) => void
  onShowPatterns: () => void
}) {
  const spots = hotspots.slice(0, TRAIL_X.length)
  const max = spots[0]?.load || 1

  return (
    <section id="zones" className="zones" aria-labelledby="zones-title">
      <header className="zones__head">
        <span className="eyebrow">02 // ZONAS DE PRESSÃO</span>
        <h2 id="zones-title">
          ONDE O DIA
          <br />
          ESTÁ RASPANDO.
        </h2>
      </header>

      {spots.length ? (
        <ol className="zones__trail">
          {spots.map((spot, index) => {
            const key = hotspotKey(spot.title)
            const x = TRAIL_X[index]
            const prev = TRAIL_X[index - 1] ?? x
            const next = TRAIL_X[index + 1] ?? x
            const strength = spot.load / max
            const size = Math.round(34 + 46 * Math.sqrt(strength))
            return (
              <li key={key} className="zone-row" style={{ ['--x' as string]: `${x}%` }}>
                <TrailSegment top={(prev + x) / 2} node={x} bottom={(x + next) / 2} nodeY={NODE_Y} first={index === 0} last={index === spots.length - 1} tone="friction" />
                <button
                  type="button"
                  className="zone-node"
                  onClick={() => onOpen(key)}
                  aria-label={`${spot.title}: ${spot.count} ocorrências, ${spot.minutes} minutos, carga ${spot.load}. Abrir nos padrões.`}
                >
                  <span className="zone-node__crater" style={{ top: NODE_Y - size / 2, marginLeft: -size / 2 }}>
                    <Crater spotKey={key} size={size} strength={strength} />
                  </span>
                  <span className="zone-node__text" style={{ marginLeft: size / 2 + 14 }}>
                    <span className="zone-node__rank">0{index + 1}</span>
                    <strong>{spot.title}</strong>
                    <span className="zone-node__reading">
                      {spot.count}× RECORRÊNCIA · {spot.minutes} MIN · LOAD {spot.load}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="field-note">SEM SINAL. Toque no núcleo para registrar o primeiro atrito do dia.</p>
      )}

      <button type="button" className="command-link" onClick={onShowPatterns}>
        <span aria-hidden="true">&gt;</span> VER CAMPO DE PADRÕES <span aria-hidden="true">↗</span>
      </button>
    </section>
  )
}
