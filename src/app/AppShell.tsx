import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TopSystemLayer } from '../components/brand/TopSystemLayer'
import { SignalPulse } from '../components/feedback/SignalPulse'
import { SystemReadout } from '../components/feedback/SystemReadout'
import { CurvedNavigation } from '../components/navigation/CurvedNavigation'
import { CoreTrigger } from '../components/radar/CoreTrigger'
import { RadarField } from '../components/radar/RadarField'
import { RadarFieldProvider, useRadarField } from '../components/radar/RadarFieldContext'
import { RadarMetricNodes, type RadarMetric } from '../components/radar/RadarMetricNode'
import { CaptureAperture } from '../features/capture/CaptureAperture'
import { RadarHome } from '../features/home/RadarHome'
import { PatternField } from '../features/patterns/PatternField'
import { RadarControl } from '../features/settings/RadarControl'
import { SignalStream } from '../features/signals/SignalStream'
import { buildInsight, summarize } from '../lib/analytics'
import { buildFieldModel } from '../lib/fieldModel'
import { sendTestNotification, subscribeToPush } from '../lib/notifications'
import { pageVariants, type PageTransitionContext } from '../motion/transitions'
import { useMotionPreferences } from '../motion/useMotionPreferences'
import type { FrictionEntry } from '../types'
import { computeGeometry, TABS, TOP_H, type AppTab, type FieldGeometry, type Point } from './geometry'
import { useFrictionStore, type NewFriction } from './useFrictionStore'
import { useViewport } from './useViewport'

const pad = (n: number, size = 3) => String(n).padStart(size, '0')
const deg = (d: number) => (d * Math.PI) / 180

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function AppShell() {
  const viewport = useViewport()
  const geometry = useMemo(() => computeGeometry(viewport), [viewport])
  const store = useFrictionStore()
  const summary = useMemo(() => summarize(store.entries), [store.entries])
  const model = useMemo(() => buildFieldModel(summary), [summary])
  const [tab, setTab] = useState<AppTab>('radar')
  const [entering, setEntering] = useState(false)

  return (
    <RadarFieldProvider geometry={geometry} model={model} tab={tab} transitioning={entering}>
      <ShellLayers
        geometry={geometry}
        store={store}
        summary={summary}
        tab={tab}
        setTab={setTab}
        entering={entering}
        setEntering={setEntering}
      />
    </RadarFieldProvider>
  )
}

interface ShellLayersProps {
  geometry: FieldGeometry
  store: ReturnType<typeof useFrictionStore>
  summary: ReturnType<typeof summarize>
  tab: AppTab
  setTab: (tab: AppTab) => void
  entering: boolean
  setEntering: (value: boolean) => void
}

function ShellLayers({ geometry, store, summary, tab, setTab, entering, setEntering }: ShellLayersProps) {
  const { reduced, prefs, setPrefs } = useMotionPreferences()
  const { launchSignal, showReadout, firePulse } = useRadarField()
  const online = useOnline()
  const insight = useMemo(() => buildInsight(store.entries), [store.entries])
  const [focusHotspot, setFocusHotspot] = useState<string | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [covered, setCovered] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { w, h } = geometry.vp
  const [transition, setTransition] = useState<PageTransitionContext>({ x: w / 2, y: h, reach: h, dir: 1, kind: 'reveal', reduced })

  /**
   * Sections transform into each other: the field re-poses, the rail indicator travels,
   * and the new section is revealed from the tapped node while the old one recedes.
   * The incoming page is fixed while it enters so the outgoing one keeps its scroll.
   */
  const navigate = useCallback(
    (next: AppTab, origin?: Point, kind: PageTransitionContext['kind'] = 'reveal') => {
      if (next === tab) return
      const o = origin ?? { x: w / 2, y: h / 2 }
      const reach = Math.hypot(Math.max(o.x, w - o.x), Math.max(o.y, h - o.y)) + 24
      setTransition({ ...o, reach, dir: Math.sign(TABS.indexOf(next) - TABS.indexOf(tab)) || 1, kind, reduced })
      setEntering(true)
      setTab(next)
      if (next !== 'patterns') setFocusHotspot(null)
    },
    [tab, w, h, reduced, setEntering, setTab]
  )

  const finishEnter = useCallback(() => {
    setEntering(false)
    window.scrollTo(0, 0)
  }, [setEntering])

  const transmit = useCallback(
    async (entry: NewFriction, from: Point) => {
      const id = await store.save(entry)
      setCaptureOpen(false)
      launchSignal(from, `SIGNAL CAPTURED // FR-${pad(id)}`)
    },
    [store, launchSignal]
  )

  const discard = useCallback(
    async (entry: FrictionEntry) => {
      await store.remove(entry.id)
      showReadout(`SIGNAL DISCARDED // FR-${pad(entry.id ?? 0)}`, 'friction', {
        label: 'DESFAZER',
        run: () => {
          store.restore(entry).then(() => showReadout('SINAL RESTAURADO'))
        }
      })
    },
    [store, showReadout]
  )

  const restoreArchive = useCallback(
    async (file: File) => {
      try {
        await store.importArchive(file)
        firePulse()
        showReadout('ARCHIVE RESTORED // BACKUP RESTAURADO')
      } catch {
        showReadout('ARQUIVO INVÁLIDO // BACKUP NÃO RESTAURADO', 'friction')
      }
    },
    [store, firePulse, showReadout]
  )

  const runSystem = useCallback(
    async (action: () => Promise<unknown>, ok: string, fallback: string) => {
      try {
        await action()
        showReadout(ok)
      } catch (error) {
        showReadout(error instanceof Error ? error.message.toUpperCase() : fallback, 'friction')
      }
    },
    [showReadout]
  )

  const metrics = useMemo<RadarMetric[]>(() => {
    const count = summary.today.length
    const high = summary.today.filter((entry) => entry.intensity >= 4).length
    return [
      {
        id: 'signals',
        label: 'SINAIS HOJE',
        value: pad(count, 2),
        context: `${high} com intensidade ≥ 4 · ${store.entries.length} no total`,
        angle: deg(196)
      },
      {
        id: 'minutes',
        label: 'MINUTOS',
        value: String(summary.todayMinutes),
        context: `≈ ${(summary.todayMinutes / 60).toFixed(1).replace('.', ',')} h drenadas hoje`,
        angle: deg(164)
      },
      {
        id: 'load',
        label: 'LOAD',
        value: String(summary.todayLoad),
        context: count ? `min × intensidade · ${Math.round(summary.todayLoad / count)} por sinal` : 'minutos × intensidade',
        angle: deg(140),
        tone: 'friction'
      }
    ]
  }, [summary, store.entries.length])

  const nextId = store.entries.reduce((max, entry) => Math.max(max, entry.id ?? 0), 0) + 1
  const pageTop = geometry.vp.safeTop + TOP_H + 8

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <RadarField covered={covered} />
      <TopSystemLayer online={online} todayCount={summary.today.length} todayLoad={summary.todayLoad} />

      <AnimatePresence>
        {tab === 'radar' && !captureOpen && (
          <motion.div key="orbit" className="orbit-layer" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <RadarMetricNodes metrics={metrics} />
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup>
        <main id="main" className="experience" tabIndex={-1}>
          <AnimatePresence initial={false} custom={transition}>
            <motion.div
              key={tab}
              className={entering ? 'experience-page is-entering' : 'experience-page'}
              custom={transition}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationComplete={(definition) => definition === 'center' && finishEnter()}
            >
              {tab === 'radar' && (
                <RadarHome
                  summary={summary}
                  insight={insight}
                  geometry={geometry}
                  onOpenHotspot={(key) => {
                    setFocusHotspot(key)
                    navigate('patterns', undefined, 'morph')
                  }}
                  onShowPatterns={() => navigate('patterns', geometry.railNodes[2])}
                />
              )}
              {tab === 'signals' && <SignalStream entries={store.entries} onDiscard={discard} />}
              {tab === 'patterns' && <PatternField summary={summary} geometry={geometry} focus={focusHotspot} onFocus={setFocusHotspot} />}
              {tab === 'settings' && (
                <RadarControl
                  prefs={prefs}
                  setPrefs={setPrefs}
                  online={online}
                  entriesCount={store.entries.length}
                  topOffset={pageTop}
                  onExport={store.exportArchive}
                  onImport={restoreArchive}
                  onTestNotification={() => runSystem(sendTestNotification, 'NOTIFICATION SENT // NOTIFICAÇÃO ENVIADA', 'NOTIFICAÇÃO INDISPONÍVEL')}
                  onEnablePush={() => runSystem(subscribeToPush, 'PUSH ARMED // WEB PUSH ATIVADO', 'PUSH INDISPONÍVEL')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </LayoutGroup>

      <CoreTrigger ref={triggerRef} hidden={captureOpen} onOpen={() => setCaptureOpen(true)} />
      <CurvedNavigation active={tab} geometry={geometry} onNavigate={(next, origin) => navigate(next, origin)} />
      <SystemReadout />

      <CaptureAperture
        open={captureOpen}
        recent={store.entries}
        nextId={nextId}
        returnFocus={triggerRef}
        onClose={() => setCaptureOpen(false)}
        onTransmit={transmit}
        onSettled={setCovered}
      />
      <SignalPulse />
    </div>
  )
}
