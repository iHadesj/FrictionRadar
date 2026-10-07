import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { TrailSegment } from '../../components/radar/Trail'
import { frictionLoad, normalizeSignature } from '../../lib/analytics'
import { hash01 } from '../../lib/fieldModel'
import type { FrictionEntry } from '../../types'
import { SignalNode, type StreamSignal } from './SignalNode'

type StreamItem = { kind: 'day'; key: string; label: string; count: number; load: number; x: number } | (StreamSignal & { kind: 'signal' })

const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const parts = dayFormat.formatToParts(date)
  const get = (type: string) => (parts.find((p) => p.type === type)?.value ?? '').replace('.', '').toUpperCase()
  const stamp = `${get('day')} ${get('month')} // ${get('weekday')}`
  if (same(date, today)) return `HOJE · ${stamp}`
  if (same(date, yesterday)) return `ONTEM · ${stamp}`
  return stamp
}

/** Builds the stream: day nodes + signals, each with a trail x offset and recurrence data. */
function buildStream(entries: FrictionEntry[]): StreamItem[] {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    const key = normalizeSignature(entry.title)
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }
  // Occurrence ordinal counts oldest → newest; entries arrive newest first.
  const seen = new Map<string, number>()
  const ordinal = new Map<FrictionEntry, number>()
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const key = normalizeSignature(entries[i].title)
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    ordinal.set(entries[i], n)
  }

  const items: StreamItem[] = []
  let currentDay = ''
  for (const entry of entries) {
    const day = new Date(entry.createdAt).toDateString()
    if (day !== currentDay) {
      currentDay = day
      const sameDay = entries.filter((e) => new Date(e.createdAt).toDateString() === day)
      items.push({
        kind: 'day',
        key: `day-${day}`,
        label: dayLabel(entry.createdAt),
        count: sameDay.length,
        load: sameDay.reduce((sum, e) => sum + frictionLoad(e), 0),
        x: 5
      })
    }
    const key = normalizeSignature(entry.title)
    // Minutes lost displace the node away from the spine; a stable jitter keeps it organic.
    const x = 8 + (Math.min(entry.minutes, 60) / 60) * 30 + (hash01(`${entry.id}-${entry.createdAt}`) - 0.5) * 8
    items.push({
      kind: 'signal',
      entry,
      key: `signal-${entry.id}`,
      x,
      recurrence: totals.get(key) ?? 1,
      ordinal: ordinal.get(entry) ?? 1,
      load: frictionLoad(entry)
    })
  }
  return items
}

export function SignalStream({ entries, onDiscard }: { entries: FrictionEntry[]; onDiscard: (entry: FrictionEntry) => void }) {
  const [openId, setOpenId] = useState<number | null>(null)
  const items = useMemo(() => buildStream(entries), [entries])
  const openIndex = items.findIndex((item) => item.kind === 'signal' && item.entry.id === openId)

  return (
    <div className="signals">
      <header className="page-head page-head--signals">
        <span className="eyebrow">RAW SIGNALS // STREAM</span>
        <h1>
          SINAIS
          <br />
          <span>CAPTURADOS.</span>
        </h1>
        <p>O histórico bruto do que drenou tempo, energia ou foco. Toque num ponto para abrir a leitura; arraste para a esquerda para descartar.</p>
        <strong className="page-head__count" aria-label={`${entries.length} sinais registrados`}>
          {String(entries.length).padStart(3, '0')}
        </strong>
      </header>

      {items.length ? (
        <LayoutGroup id="stream">
          <ol className="stream" aria-label="Linha de sinais capturados">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const prev = items[index - 1]?.x ?? item.x
                const next = items[index + 1]?.x ?? item.x
                const trail = { top: (prev + item.x) / 2, bottom: (item.x + next) / 2, first: index === 0, last: index === items.length - 1 }
                if (item.kind === 'day') {
                  return <DayNode key={item.key} item={item} trail={trail} />
                }
                return (
                  <SignalNode
                    key={item.key}
                    signal={item}
                    trail={trail}
                    open={openId === item.entry.id}
                    neighbour={openIndex >= 0 && Math.abs(index - openIndex) === 1 ? Math.sign(index - openIndex) : 0}
                    onToggle={() => setOpenId(openId === item.entry.id ? null : item.entry.id ?? null)}
                    onDiscard={() => {
                      if (openId === item.entry.id) setOpenId(null)
                      onDiscard(item.entry)
                    }}
                  />
                )
              })}
            </AnimatePresence>
          </ol>
        </LayoutGroup>
      ) : (
        <p className="field-note">NENHUM SINAL CAPTURADO. Toque no núcleo do radar para registrar o primeiro.</p>
      )}
    </div>
  )
}

function DayNode({
  item,
  trail
}: {
  item: Extract<StreamItem, { kind: 'day' }>
  trail: { top: number; bottom: number; first: boolean; last: boolean }
}) {
  return (
    <motion.li layout="position" className="stream-day" style={{ ['--x' as string]: `${item.x}%` }} exit={{ opacity: 0, height: 0 }}>
      <TrailSegment top={trail.top} node={item.x} bottom={trail.bottom} nodeY={30} first={trail.first} last={trail.last} />
      <span className="stream-day__node" aria-hidden="true" />
      <h2 className="stream-day__label">
        {item.label}
        <span>
          {item.count} {item.count === 1 ? 'SINAL' : 'SINAIS'} · LOAD {item.load}
        </span>
      </h2>
    </motion.li>
  )
}
