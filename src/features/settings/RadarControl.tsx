import { useEffect, useState, type ReactNode } from 'react'
import { isStandalone } from '../../lib/notifications'
import type { AppPreferences } from '../../types'
import { ArchiveControls } from './ArchiveControls'
import { SignalToggle } from './SignalToggle'

interface RadarControlProps {
  prefs: AppPreferences
  setPrefs: (next: AppPreferences) => void
  online: boolean
  entriesCount: number
  topOffset: number
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
  onTestNotification: () => void
  onEnablePush: () => void
}

function Channel({ index, title, depth, children }: { index: string; title: string; depth: number; children: ReactNode }) {
  const id = `channel-${index}`
  return (
    <section className="channel" style={{ ['--depth' as string]: depth }} aria-labelledby={id}>
      <span className="channel__marker" aria-hidden="true" />
      <h2 id={id} className="channel__title">
        <span>CH.{index}</span> {title}
      </h2>
      <div className="channel__body">{children}</div>
    </section>
  )
}

/** Settings as a calibration layer of the instrument: channels along one depth line, no cards. */
export function RadarControl({
  prefs,
  setPrefs,
  online,
  entriesCount,
  topOffset,
  onExport,
  onImport,
  onTestNotification,
  onEnablePush
}: RadarControlProps) {
  const [worker, setWorker] = useState<'ativo' | 'registrando' | 'indisponível'>('registrando')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setWorker('indisponível')
      return
    }
    if (navigator.serviceWorker.controller) setWorker('ativo')
    let cancelled = false
    navigator.serviceWorker.ready.then(() => !cancelled && setWorker('ativo')).catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="control" style={{ paddingTop: topOffset }}>
      <header className="page-head page-head--control">
        <span className="eyebrow">SYSTEM / LOCAL FIRST</span>
        <h1>
          RADAR
          <br />
          <span>CONTROL.</span>
        </h1>
        <p>Seus dados principais ficam neste dispositivo. Internet é opcional para o funcionamento diário.</p>
      </header>

      <div className="channels">
        <svg className="channels__depth" aria-hidden="true">
          <line x1="1" y1="0" x2="1" y2="100%" />
        </svg>

        <Channel index="01" title="VISUAL ENGINE" depth={0}>
          <SignalToggle label="Elemento 3D" hint="Núcleo WebGL. Desligado, o radar usa o campo SVG." checked={prefs.show3D} onChange={(v) => setPrefs({ ...prefs, show3D: v })} />
          <SignalToggle label="Modo leve" hint="Recomendado no iPhone 11: menos FPS, menos partículas." checked={prefs.lowPowerMode} onChange={(v) => setPrefs({ ...prefs, lowPowerMode: v })} />
          <SignalToggle label="Reduzir movimento" hint="Estabiliza o campo e troca morphs por mudanças curtas." checked={prefs.reducedMotion} onChange={(v) => setPrefs({ ...prefs, reducedMotion: v })} />
        </Channel>

        <Channel index="02" title="ALARME DO RADAR" depth={1}>
          <p className="channel__note">
            O iOS aceita Web Push em web apps instalados na Tela de Início. Este build já possui Service Worker e handler de push; envio futuro exige um endpoint Web Push.
          </p>
          <button type="button" className="command" onClick={onTestNotification}>
            <span className="command__prompt" aria-hidden="true">&gt;</span>
            <span className="command__name">TEST NOTIFICATION</span>
            <span className="command__hint">Testar notificação neste aparelho</span>
          </button>
          <button type="button" className="command" onClick={onEnablePush}>
            <span className="command__prompt" aria-hidden="true">&gt;</span>
            <span className="command__name">ENABLE WEB PUSH</span>
            <span className="command__hint">Ativar avisos mesmo com o app fechado</span>
          </button>
        </Channel>

        <Channel index="03" title="ARQUIVO LOCAL" depth={2}>
          <ArchiveControls count={entriesCount} onExport={onExport} onImport={onImport} />
        </Channel>

        <Channel index="04" title="PWA STATUS" depth={1}>
          <dl className="status-lines">
            <div>
              <dt>MODO</dt>
              <dd>{isStandalone() ? 'INSTALADO COMO APP' : 'ABERTO NO NAVEGADOR'}</dd>
            </div>
            <div>
              <dt>REDE</dt>
              <dd className={online ? undefined : 'is-friction'}>{online ? 'ONLINE' : 'OFFLINE — tudo continua funcionando'}</dd>
            </div>
            <div>
              <dt>SERVICE WORKER</dt>
              <dd>{worker.toUpperCase()}</dd>
            </div>
          </dl>
          <p className="channel__note">No iPhone: Compartilhar → Adicionar à Tela de Início → deixe “Abrir como App” ativado.</p>
        </Channel>
      </div>
    </div>
  )
}
