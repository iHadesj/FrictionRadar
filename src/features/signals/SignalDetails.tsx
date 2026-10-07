import { motion } from 'framer-motion'
import { useState } from 'react'
import { ease } from '../../motion/motionTokens'
import type { StreamSignal } from './SignalNode'

const fullFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
const INTENSITY_WORD = ['', 'LEVE', 'BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA']

/** The reading emerges from the trail itself — text on the field, no card. */
export function SignalDetails({ id, signal, onDiscard }: { id: string; signal: StreamSignal; onDiscard: () => void }) {
  const { entry, load, recurrence, ordinal } = signal
  const [armed, setArmed] = useState(false)

  return (
    <motion.div
      id={id}
      className="signal-details"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.34, ease: ease.out }}
    >
      <dl className="signal-details__readings">
        <div>
          <dt>CARGA</dt>
          <dd>{load}</dd>
        </div>
        <div>
          <dt>INTENSIDADE</dt>
          <dd>
            {entry.intensity}/5 <small>{INTENSITY_WORD[entry.intensity]}</small>
          </dd>
        </div>
        <div>
          <dt>RECORRÊNCIA</dt>
          <dd>
            {ordinal}ª de {recurrence}
          </dd>
        </div>
      </dl>
      <p className="signal-details__when">{fullFormat.format(new Date(entry.createdAt)).toUpperCase()}</p>
      {entry.note && <p className="signal-details__note">“{entry.note}”</p>}
      <button
        type="button"
        className={armed ? 'command-link command-link--danger is-armed' : 'command-link command-link--danger'}
        onClick={() => (armed ? onDiscard() : setArmed(true))}
        onBlur={() => setArmed(false)}
      >
        <span aria-hidden="true">&gt;</span> {armed ? 'CONFIRMAR DESCARTE' : 'DESCARTAR SINAL'}
      </button>
    </motion.div>
  )
}
