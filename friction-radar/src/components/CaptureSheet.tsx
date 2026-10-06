import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { FrictionCategory, FrictionContext, FrictionEntry } from '../types'

const categories: FrictionCategory[] = ['WORK', 'DEV', 'HOME', 'ADMIN', 'ERRANDS', 'PERSONAL']
const contexts: FrictionContext[] = ['DESK', 'MOBILE', 'OUT', 'HOME', 'ANYWHERE']

interface CaptureSheetProps {
  open: boolean
  recent: FrictionEntry[]
  onClose: () => void
  onSave: (entry: Omit<FrictionEntry, 'id' | 'createdAt'>) => Promise<void>
}

export function CaptureSheet({ open, recent, onClose, onSave }: CaptureSheetProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<FrictionCategory>('WORK')
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [minutes, setMinutes] = useState(5)
  const [context, setContext] = useState<FrictionContext>('DESK')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

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

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSave({ title: trimmed, category, intensity, minutes, context, note: note.trim() || undefined })
      setTitle('')
      setNote('')
      setMinutes(5)
      setIntensity(3)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section
            className="capture-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label="Registrar atrito"
          >
            <div className="sheet-handle" />
            <header className="capture-sheet__header">
              <div>
                <span className="eyebrow">SIGNAL CAPTURE</span>
                <h2>O que te atrasou?</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Fechar">×</button>
            </header>

            <label className="field field--hero">
              <span>ATRITO</span>
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: procurei o mesmo comando de novo"
                maxLength={90}
              />
            </label>

            {recentTitles.length > 0 && (
              <div className="recent-signals">
                <span>REPETIR SINAL</span>
                <div>
                  {recentTitles.map((entry) => (
                    <button
                      key={`${entry.id}-${entry.title}`}
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
              </div>
            )}

            <div className="capture-grid">
              <div className="field">
                <span>CATEGORIA</span>
                <div className="chip-row">
                  {categories.map((item) => (
                    <button key={item} className={category === item ? 'chip chip--active' : 'chip'} onClick={() => setCategory(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>INTENSIDADE</span>
                <div className="severity-control" aria-label="Intensidade do atrito">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <button
                      key={item}
                      className={item <= intensity ? 'severity-dot severity-dot--on' : 'severity-dot'}
                      onClick={() => setIntensity(item as 1 | 2 | 3 | 4 | 5)}
                      aria-label={`Intensidade ${item}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field field--compact">
                <span>MINUTOS PERDIDOS</span>
                <input type="number" min="1" max="240" inputMode="numeric" value={minutes} onChange={(event) => setMinutes(Math.max(1, Math.min(240, Number(event.target.value) || 1)))} />
              </label>

              <div className="field">
                <span>CONTEXTO</span>
                <div className="chip-row">
                  {contexts.map((item) => (
                    <button key={item} className={context === item ? 'chip chip--active' : 'chip'} onClick={() => setContext(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>NOTA OPCIONAL</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="O que aconteceu?" rows={2} maxLength={180} />
              </label>
            </div>

            <button className="capture-submit" onClick={submit} disabled={!title.trim() || saving}>
              <span>{saving ? 'GRAVANDO...' : 'MARCAR NO RADAR'}</span>
              <strong>↗</strong>
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
