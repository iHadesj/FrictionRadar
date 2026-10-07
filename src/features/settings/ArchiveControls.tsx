import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ease } from '../../motion/motionTokens'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

/** Backup as system commands. A scan line runs across the records and resolves to ARCHIVE READY. */
export function ArchiveControls({
  count,
  onExport,
  onImport
}: {
  count: number
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
}) {
  const { reduced } = useMotionPreferences()
  const [phase, setPhase] = useState<'idle' | 'sweeping' | 'ready' | 'restoring'>('idle')
  const file = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  const marks = Math.max(1, Math.min(count, 48))

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const runExport = async () => {
    setPhase('sweeping')
    await onExport()
    timers.current.push(
      window.setTimeout(() => setPhase('ready'), reduced ? 0 : 720),
      window.setTimeout(() => setPhase('idle'), reduced ? 2400 : 3200)
    )
  }

  return (
    <div className="archive">
      <div className={`archive__records is-${phase}`} aria-hidden="true">
        {Array.from({ length: marks }, (_, i) => (
          <i key={i} style={{ transitionDelay: phase === 'sweeping' ? `${(i / marks) * 0.62}s` : '0s' }} />
        ))}
        <AnimatePresence>
          {phase === 'sweeping' && !reduced && (
            <motion.span
              className="archive__scan"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.68, ease: ease.inOut }}
            />
          )}
        </AnimatePresence>
      </div>
      <p className="archive__state" aria-live="polite">
        {phase === 'ready'
          ? `ARCHIVE READY // ${count} ${count === 1 ? 'REGISTRO' : 'REGISTROS'}`
          : phase === 'sweeping'
            ? 'VARRENDO REGISTROS…'
            : phase === 'restoring'
              ? 'RESTAURANDO…'
              : `${count} ${count === 1 ? 'REGISTRO LOCAL' : 'REGISTROS LOCAIS'}`}
      </p>

      <button type="button" className="command" onClick={runExport} disabled={phase === 'sweeping'}>
        <span className="command__prompt" aria-hidden="true">&gt;</span>
        <span className="command__name">EXPORT LOCAL ARCHIVE</span>
        <span className="command__hint">Baixar backup dos seus dados (.json)</span>
      </button>
      <button type="button" className="command" onClick={() => file.current?.click()} disabled={phase === 'restoring'}>
        <span className="command__prompt" aria-hidden="true">&gt;</span>
        <span className="command__name">RESTORE LOCAL ARCHIVE</span>
        <span className="command__hint">Restaurar de um backup .json — substitui os dados atuais</span>
      </button>
      <input
        ref={file}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={async (event) => {
          const picked = event.target.files?.[0]
          event.target.value = ''
          if (!picked) return
          setPhase('restoring')
          try {
            await onImport(picked)
          } finally {
            setPhase('idle')
          }
        }}
      />
    </div>
  )
}
