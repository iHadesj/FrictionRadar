import { motion } from 'framer-motion'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Point } from '../../app/geometry'
import type { NewFriction } from '../../app/useFrictionStore'
import { TrailSegment } from '../../components/radar/Trail'
import { routeReveal } from '../../motion/transitions'
import { useMotionPreferences } from '../../motion/useMotionPreferences'
import type { FrictionCategory, FrictionContext, FrictionEntry } from '../../types'
import { IntensityWave } from './IntensityWave'
import { OrbitSelector } from './OrbitSelector'
import { TimeArc } from './TimeArc'

const categories: readonly FrictionCategory[] = ['WORK', 'DEV', 'HOME', 'ADMIN', 'ERRANDS', 'PERSONAL']
const contexts: readonly FrictionContext[] = ['DESK', 'MOBILE', 'OUT', 'HOME', 'ANYWHERE']
/** Route x per step (% of the rail column): an asymmetric vertical path. */
const ROUTE_X = [30, 62, 84, 58, 34, 66]

interface SignalRouteFormProps {
  recent: FrictionEntry[]
  nextId: number
  onClose: () => void
  onTransmit: (entry: NewFriction, from: Point) => Promise<void>
}

function RouteStep({ index, code, label, children, labelFor }: { index: number; code: string; label: string; children: ReactNode; labelFor?: string }) {
  const { reduced } = useMotionPreferences()
  const x = ROUTE_X[index]
  const prev = ROUTE_X[index - 1] ?? x
  const next = ROUTE_X[index + 1] ?? x
  const Label = labelFor ? 'label' : 'span'
  return (
    <motion.li className="route-step" style={{ ['--indent' as string]: (x - 30) / 18 }} {...routeReveal(index, reduced)}>
      <div className="route-step__rail" aria-hidden="true">
        <TrailSegment top={(prev + x) / 2} node={x} bottom={(x + next) / 2} nodeY={14} first={index === 0} last={index === ROUTE_X.length - 1} />
        <span className="route-step__node" style={{ left: `${x}%` }} />
      </div>
      <div className="route-step__body">
        <Label className="route-step__label" {...(labelFor ? { htmlFor: labelFor } : {})}>
          <span>{code} //</span> {label}
        </Label>
        {children}
      </div>
    </motion.li>
  )
}

/** The form is a signal route: ATRITO → CONTEXTO → INTENSIDADE → TEMPO → NOTA → TRANSMIT. */
export function SignalRouteForm({ recent, nextId, onClose, onTransmit }: SignalRouteFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<FrictionCategory>('WORK')
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [minutes, setMinutes] = useState(5)
  const [context, setContext] = useState<FrictionContext>('DESK')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const transmitNode = useRef<SVGCircleElement>(null)

  const recentTitles = useMemo(() => {
    const seen = new Set<string>()
    return recent
      .filter((entry) => {
        const key = entry.title.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
  }, [recent])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const rect = transmitNode.current?.getBoundingClientRect()
    const from = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    try {
      await onTransmit({ title: trimmed, category, intensity, minutes, context, note: note.trim() || undefined }, from)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="route" onSubmit={submit} noValidate>
      <header className="route__head">
        <span className="eyebrow">SIGNAL CAPTURE // FR-{String(nextId).padStart(3, '0')}</span>
        <h2 id="aperture-title">O que te atrasou?</h2>
        <button type="button" className="route__close" onClick={onClose} aria-label="Fechar captura">
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <ol className="route__steps">
        <RouteStep index={0} code="01" label="ATRITO" labelFor="capture-title">
          <input
            id="capture-title"
            className="route__title-input"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: procurei o comando de novo"
            maxLength={90}
            autoComplete="off"
            enterKeyHint="send"
          />
          {recentTitles.length > 0 && (
            <div className="route__recent" role="group" aria-label="Repetir sinal recente">
              <span aria-hidden="true">REPETIR SINAL</span>
              {recentTitles.map((entry) => (
                <button
                  key={`${entry.id}-${entry.title}`}
                  type="button"
                  onClick={() => {
                    setTitle(entry.title)
                    setCategory(entry.category)
                    setContext(entry.context)
                    setMinutes(entry.minutes)
                    setIntensity(entry.intensity)
                  }}
                >
                  {entry.title}
                </button>
              ))}
            </div>
          )}
        </RouteStep>

        <RouteStep index={1} code="02" label="CONTEXTO">
          <OrbitSelector name="category" label="CATEGORIA" options={categories} value={category} onChange={setCategory} />
          <OrbitSelector name="context" label="ONDE" options={contexts} value={context} onChange={setContext} />
        </RouteStep>

        <RouteStep index={2} code="03" label="INTENSIDADE">
          <IntensityWave value={intensity} onChange={setIntensity} />
        </RouteStep>

        <RouteStep index={3} code="04" label="TEMPO">
          <TimeArc value={minutes} onChange={setMinutes} />
        </RouteStep>

        <RouteStep index={4} code="05" label="NOTA OPCIONAL" labelFor="capture-note">
          <textarea id="capture-note" className="route__note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="O que aconteceu?" rows={2} maxLength={180} />
        </RouteStep>

        <RouteStep index={5} code="06" label="TRANSMITIR">
          <button type="submit" className="transmit" disabled={!title.trim() || saving}>
            <svg className="transmit__arcs" viewBox="-40 -40 80 80" aria-hidden="true">
              <path d="M-14,-20 A24,24 0 0 1 -14,20" className="transmit__wave" />
              <path d="M-4,-30 A36,36 0 0 1 -4,30" className="transmit__wave transmit__wave--2" />
              <circle ref={transmitNode} r={7} className="transmit__node" />
            </svg>
            <span className="transmit__text">
              <strong>{saving ? 'TRANSMITINDO…' : 'TRANSMIT SIGNAL'}</strong>
              <small>MARCAR NO RADAR ↗</small>
            </span>
          </button>
          {!title.trim() && <p className="route__hint">Escreva o atrito no passo 01 para transmitir.</p>}
        </RouteStep>
      </ol>
    </form>
  )
}
