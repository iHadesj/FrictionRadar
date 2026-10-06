import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BrandMark } from './components/BrandMark'
import { CaptureSheet } from './components/CaptureSheet'
import { NavBar, type AppTab } from './components/NavBar'
import { RadarScene } from './components/RadarScene'
import { buildInsight, summarize } from './lib/analytics'
import { addFriction, deleteFriction, exportDatabase, importDatabase, listFrictions } from './lib/db'
import { isStandalone, sendTestNotification, subscribeToPush, updateAppBadge } from './lib/notifications'
import type { AppPreferences, FrictionEntry } from './types'

const defaultPrefs: AppPreferences = {
  reducedMotion: false,
  lowPowerMode: true,
  show3D: true
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function percent(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(3, Math.min(100, Math.round((value / max) * 100)))
}

export default function App() {
  const systemReduced = useReducedMotion()
  const [tab, setTab] = useState<AppTab>('radar')
  const [entries, setEntries] = useState<FrictionEntry[]>([])
  const [captureOpen, setCaptureOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const fileInput = useRef<HTMLInputElement>(null)
  const [prefs, setPrefs] = useState<AppPreferences>(() => {
    try {
      return { ...defaultPrefs, ...JSON.parse(localStorage.getItem('friction-radar:prefs') || '{}') }
    } catch {
      return defaultPrefs
    }
  })

  const reducedMotion = Boolean(systemReduced || prefs.reducedMotion)

  const refresh = async () => {
    const data = await listFrictions()
    setEntries(data)
    const highPriority = data.filter((entry) => entry.intensity >= 4).slice(0, 9).length
    await updateAppBadge(highPriority)
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    localStorage.setItem('friction-radar:prefs', JSON.stringify(prefs))
  }, [prefs])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const summary = useMemo(() => summarize(entries), [entries])
  const insight = useMemo(() => buildInsight(entries), [entries])
  const maxHotspotLoad = summary.hotspots[0]?.load ?? 1

  const saveEntry = async (entry: Omit<FrictionEntry, 'id' | 'createdAt'>) => {
    await addFriction({ ...entry, createdAt: new Date().toISOString() })
    await refresh()
    setToast('SINAL REGISTRADO')
  }

  const removeEntry = async (id?: number) => {
    if (!id) return
    await deleteFriction(id)
    await refresh()
    setToast('SINAL REMOVIDO')
  }

  const downloadBackup = async () => {
    const json = await exportDatabase()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `friction-radar-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uploadBackup = async (file: File) => {
    try {
      await importDatabase(await file.text())
      await refresh()
      setToast('BACKUP RESTAURADO')
    } catch {
      setToast('BACKUP INVALIDO')
    }
  }

  return (
    <div className="app-shell">
      <div className="app-noise" aria-hidden="true" />
      <header className="topbar">
        <BrandMark />
        <div className="system-status">
          <span className={online ? 'status-led' : 'status-led status-led--danger'} />
          <strong>{online ? 'LOCAL / READY' : 'OFFLINE / READY'}</strong>
        </div>
      </header>

      <main className="page-stack">
        <AnimatePresence mode="wait">
          {tab === 'radar' && (
            <motion.section
              key="radar"
              className="page page--radar"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            >
              <section className="hero-radar">
                <div className="hero-radar__copy">
                  <span className="eyebrow">TODAY / LIVE SIGNAL</span>
                  <h1>
                    ENCONTRE O<br />
                    <span>ATRITO.</span>
                  </h1>
                  <p>Registre o que interrompe, repete ou rouba minutos. O radar transforma pequenas irritacoes em padroes visiveis.</p>
                </div>

                <div className="hero-radar__visual">
                  <div className="radar-frame">
                    <div className="radar-frame__label radar-frame__label--a">FR//{String(summary.today.length).padStart(2, '0')}</div>
                    <div className="radar-frame__label radar-frame__label--b">LOAD {summary.todayLoad}</div>
                    {prefs.show3D && <RadarScene intensity={summary.todayLoad} lowPower={prefs.lowPowerMode} paused={reducedMotion} />}
                    {!prefs.show3D && <div className="radar-static" aria-hidden="true"><span /><span /><span /></div>}
                  </div>
                </div>

                <button className="primary-capture" onClick={() => setCaptureOpen(true)}>
                  <span>+ REGISTRAR ATRITO</span>
                  <em>~ 05 SEC</em>
                </button>
              </section>

              <section className="metric-strip">
                <article>
                  <span>SINAIS HOJE</span>
                  <strong>{String(summary.today.length).padStart(2, '0')}</strong>
                </article>
                <article>
                  <span>MIN PERDIDOS</span>
                  <strong>{summary.todayMinutes}</strong>
                </article>
                <article>
                  <span>CARGA</span>
                  <strong>{summary.todayLoad}</strong>
                </article>
              </section>

              <section className="insight-panel">
                <div className="insight-panel__index">01</div>
                <div>
                  <span className="eyebrow">RADAR READOUT</span>
                  <h2>O PADRAO QUE MERECE ATENCAO.</h2>
                  <p>{insight}</p>
                </div>
                <div className="insight-panel__scope" aria-hidden="true">◎</div>
              </section>

              <section className="section-block">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">HOTSPOTS</span>
                    <h2>ONDE O DIA ESTA RASPANDO.</h2>
                  </div>
                  <button className="text-button" onClick={() => setTab('patterns')}>VER PADROES ↗</button>
                </div>

                {summary.hotspots.length ? (
                  <div className="hotspot-list">
                    {summary.hotspots.slice(0, 4).map((item, index) => (
                      <article className="hotspot-row" key={`${item.title}-${index}`}>
                        <div className="hotspot-row__rank">0{index + 1}</div>
                        <div className="hotspot-row__body">
                          <div className="hotspot-row__top">
                            <strong>{item.title}</strong>
                            <span>{item.count}x / {item.minutes} min</span>
                          </div>
                          <div className="hotspot-row__track"><i style={{ width: `${percent(item.load, maxHotspotLoad)}%` }} /></div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">SEM SINAL. Registre o primeiro atrito do dia.</div>
                )}
              </section>
            </motion.section>
          )}

          {tab === 'signals' && (
            <motion.section key="signals" className="page" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="page-title">
                <span className="eyebrow">RAW SIGNALS</span>
                <h1>SINAIS<br/><span>CAPTURADOS.</span></h1>
                <p>O historico bruto do que drenou tempo, energia ou foco.</p>
              </div>

              <div className="signal-list">
                {entries.map((entry, index) => (
                  <article className="signal-card" key={entry.id}>
                    <div className="signal-card__number">{String(index + 1).padStart(2, '0')}</div>
                    <div className="signal-card__main">
                      <div className="signal-card__meta">
                        <span>{entry.category}</span><span>{entry.context}</span><span>{formatTime(entry.createdAt)}</span>
                      </div>
                      <h3>{entry.title}</h3>
                      {entry.note && <p>{entry.note}</p>}
                      <div className="signal-card__footer">
                        <span>{entry.minutes} MIN</span>
                        <div className="mini-severity" aria-label={`Intensidade ${entry.intensity}`}>
                          {[1,2,3,4,5].map((v) => <i key={v} className={v <= entry.intensity ? 'is-on' : ''} />)}
                        </div>
                      </div>
                    </div>
                    <button className="signal-delete" onClick={() => removeEntry(entry.id)} aria-label={`Excluir ${entry.title}`}>×</button>
                  </article>
                ))}
                {!entries.length && <div className="empty-state">NENHUM SINAL CAPTURADO.</div>}
              </div>
            </motion.section>
          )}

          {tab === 'patterns' && (
            <motion.section key="patterns" className="page" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="page-title">
                <span className="eyebrow">PATTERN ENGINE</span>
                <h1>PADROES<br/><span>DE ATRITO.</span></h1>
                <p>Recorrencia + tempo + intensidade. O objetivo nao e registrar para sempre; e descobrir o que deve deixar de existir.</p>
              </div>

              <section className="pattern-grid">
                <article className="pattern-card pattern-card--wide">
                  <span className="eyebrow">TOP FRICTIONS</span>
                  <h2>ALVOS DE ELIMINACAO</h2>
                  <div className="pattern-bars">
                    {summary.hotspots.map((item, index) => (
                      <div className="pattern-bar" key={item.title}>
                        <div><span>0{index + 1}</span><strong>{item.title}</strong><em>{item.load} pts</em></div>
                        <div className="pattern-bar__track"><i style={{ width: `${percent(item.load, maxHotspotLoad)}%` }} /></div>
                      </div>
                    ))}
                    {!summary.hotspots.length && <div className="empty-state">AINDA SEM PADROES.</div>}
                  </div>
                </article>

                <article className="pattern-card">
                  <span className="eyebrow">LOAD BY AREA</span>
                  <h2>CONTEXTOS</h2>
                  <div className="category-stack">
                    {summary.topCategories.map((item) => (
                      <div key={item.name}>
                        <span>{item.name}</span><strong>{item.load}</strong>
                        <i style={{ width: `${percent(item.load, summary.topCategories[0]?.load ?? 1)}%` }} />
                      </div>
                    ))}
                  </div>
                </article>

                <article className="pattern-card pattern-card--accent">
                  <span className="eyebrow">RULE</span>
                  <h2>SE REPETIU 3X,<br/>NAO E AZAR.</h2>
                  <p>Transforme recorrencia em acao: automatizar, documentar, delegar, mover ou eliminar.</p>
                </article>
              </section>
            </motion.section>
          )}

          {tab === 'settings' && (
            <motion.section key="settings" className="page" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="page-title">
                <span className="eyebrow">SYSTEM / LOCAL FIRST</span>
                <h1>RADAR<br/><span>CONTROL.</span></h1>
                <p>Seus dados principais ficam neste dispositivo. Internet e opcional para o funcionamento diario.</p>
              </div>

              <div className="settings-list">
                <section className="settings-card">
                  <div><span className="eyebrow">PWA STATUS</span><h2>{isStandalone() ? 'INSTALADO COMO APP' : 'ABERTO NO NAVEGADOR'}</h2></div>
                  <p>No iPhone: Compartilhar → Adicionar a Tela de Inicio → deixe “Abrir como App” ativado.</p>
                </section>

                <section className="settings-card">
                  <div><span className="eyebrow">PERFORMANCE</span><h2>VISUAL ENGINE</h2></div>
                  <label className="toggle-row"><span>Elemento 3D</span><input type="checkbox" checked={prefs.show3D} onChange={(e) => setPrefs({ ...prefs, show3D: e.target.checked })} /></label>
                  <label className="toggle-row"><span>Modo leve (recomendado no iPhone 11)</span><input type="checkbox" checked={prefs.lowPowerMode} onChange={(e) => setPrefs({ ...prefs, lowPowerMode: e.target.checked })} /></label>
                  <label className="toggle-row"><span>Reduzir movimento</span><input type="checkbox" checked={prefs.reducedMotion} onChange={(e) => setPrefs({ ...prefs, reducedMotion: e.target.checked })} /></label>
                </section>

                <section className="settings-card">
                  <div><span className="eyebrow">NOTIFICATIONS</span><h2>ALARME DO RADAR</h2></div>
                  <p>O iOS aceita Web Push em web apps instalados na Tela de Inicio. Este build ja possui Service Worker e handler de push; envio futuro exige um endpoint Web Push.</p>
                  <div className="settings-actions">
                    <button className="settings-action" onClick={async () => {
                      try { await sendTestNotification(); setToast('NOTIFICACAO ENVIADA') } catch (error) { setToast(error instanceof Error ? error.message.toUpperCase() : 'NOTIFICACAO INDISPONIVEL') }
                    }}>TESTAR NOTIFICACAO ↗</button>
                    <button className="settings-action" onClick={async () => {
                      try { await subscribeToPush(); setToast('PUSH ATIVADO') } catch (error) { setToast(error instanceof Error ? error.message.toUpperCase() : 'PUSH INDISPONIVEL') }
                    }}>ATIVAR WEB PUSH ↗</button>
                  </div>
                </section>

                <section className="settings-card">
                  <div><span className="eyebrow">DATA</span><h2>BACKUP LOCAL</h2></div>
                  <div className="settings-actions">
                    <button className="settings-action" onClick={downloadBackup}>EXPORTAR JSON ↓</button>
                    <button className="settings-action" onClick={() => fileInput.current?.click()}>IMPORTAR JSON ↑</button>
                    <input ref={fileInput} hidden type="file" accept="application/json" onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) uploadBackup(file)
                      event.target.value = ''
                    }} />
                  </div>
                </section>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <button className="floating-capture" onClick={() => setCaptureOpen(true)} aria-label="Registrar atrito">+</button>
      <NavBar active={tab} onChange={setTab} />

      <CaptureSheet open={captureOpen} recent={entries} onClose={() => setCaptureOpen(false)} onSave={saveEntry} />

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
