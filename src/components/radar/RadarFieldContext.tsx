import { animate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppTab, FieldGeometry, Point } from '../../app/geometry'
import type { FieldModel } from '../../lib/fieldModel'
import { haptic } from '../../lib/haptics'
import { durations } from '../../motion/motionTokens'
import { instant, springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

export interface ReadoutMessage {
  id: number
  text: string
  tone: 'radar' | 'friction'
  action?: { label: string; run: () => void }
}

export interface SignalFlight {
  id: number
  from: Point
  to: Point
  label: string
}

interface RadarFieldValue {
  geometry: FieldGeometry
  model: FieldModel
  tab: AppTab
  /** Final on-screen pose of the core: section pose blended into the dock by scroll. */
  coreX: MotionValue<number>
  coreY: MotionValue<number>
  coreS: MotionValue<number>
  /** Pose scale without gesture/pulse modulation (for hit areas). */
  coreScale: MotionValue<number>
  /** 0 → section pose, 1 → docked on the rail. */
  dockProgress: MotionValue<number>
  /** 0..1 while the core is pressed (hold to capture). */
  tension: MotionValue<number>
  /** 0..1 transient deformation after a captured signal lands. */
  pulse: MotionValue<number>
  scrollVelocity: MotionValue<number>
  getCore: () => { x: number; y: number; r: number }
  firePulse: () => void
  launchSignal: (from: Point, label: string) => void
  showReadout: (text: string, tone?: ReadoutMessage['tone'], action?: ReadoutMessage['action']) => void
  readout: ReadoutMessage | null
  dismissReadout: () => void
  flights: SignalFlight[]
  landFlight: (id: number) => void
  /** Increments every time a pulse fires — keys the concentric wave. */
  waves: number
}

const RadarFieldContext = createContext<RadarFieldValue | null>(null)

export function useRadarField() {
  const value = useContext(RadarFieldContext)
  if (!value) throw new Error('useRadarField must be used inside <RadarFieldProvider>')
  return value
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

interface ProviderProps {
  geometry: FieldGeometry
  model: FieldModel
  tab: AppTab
  /** While a section transition runs the field ignores page scroll (the old page is still scrolled). */
  transitioning: boolean
  children: ReactNode
}

export function RadarFieldProvider({ geometry, model, tab, transitioning, children }: ProviderProps) {
  const { reduced } = useMotionPreferences()
  const geoRef = useRef(geometry)
  geoRef.current = geometry
  const tabRef = useRef(tab)
  tabRef.current = tab

  const start = geometry.poses[tab]
  const poseX = useMotionValue(start.x)
  const poseY = useMotionValue(start.y)
  const poseS = useMotionValue(start.s)
  const tension = useMotionValue(0)
  const pulse = useMotionValue(0)

  // The field travels between section poses with one spring; reduced motion snaps.
  useEffect(() => {
    const pose = geometry.poses[tab]
    const transition = reduced ? instant : springs.field
    const controls = [animate(poseX, pose.x, transition), animate(poseY, pose.y, transition), animate(poseS, pose.s, transition)]
    return () => controls.forEach((c) => c.stop())
  }, [geometry, tab, reduced, poseX, poseY, poseS])

  // Native scroll drives the core into the dock. No scroll-jacking: we only read it.
  const { scrollY } = useScroll()
  const fieldScroll = useMotionValue(0)
  const transitioningRef = useRef(transitioning)
  transitioningRef.current = transitioning
  useEffect(() => {
    fieldScroll.set(transitioning ? 0 : window.scrollY)
  }, [transitioning, tab, fieldScroll])
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (!transitioningRef.current) fieldScroll.set(y)
  })

  const rawDock = useTransform(fieldScroll, (y) => {
    const p = Math.min(1, Math.max(0, y / geoRef.current.dockDistance[tabRef.current]))
    return reduced ? (p > 0.5 ? 1 : 0) : p
  })
  const smoothDock = useSpring(rawDock, { stiffness: 220, damping: 38, mass: 0.6 })
  const dockProgress = reduced ? rawDock : smoothDock

  const coreX = useTransform([poseX, dockProgress], ([x, p]: number[]) => lerp(x, geoRef.current.dock.x, p))
  const coreY = useTransform([poseY, dockProgress], ([y, p]: number[]) => lerp(y, geoRef.current.dock.y, p))
  const coreScale = useTransform([poseS, dockProgress], ([s, p]: number[]) => lerp(s, geoRef.current.dock.s, p))
  const coreS = useTransform([coreScale, tension, pulse], ([s, t, k]: number[]) => s * (1 - 0.07 * t) * (1 + 0.06 * k))

  const scrollVelocity = useSpring(useVelocityClamped(scrollY), { stiffness: 120, damping: 30 })

  const getCore = useCallback(
    () => ({ x: coreX.get(), y: coreY.get(), r: geoRef.current.R * 0.96 * coreS.get() }),
    [coreX, coreY, coreS]
  )

  const [waves, setWaves] = useState(0)
  const firePulse = useCallback(() => {
    setWaves((count) => count + 1)
    if (reduced) {
      pulse.set(0)
      return
    }
    animate(pulse, 1, { duration: 0.14, ease: 'easeOut' }).then(() => animate(pulse, 0, springs.settle))
  }, [pulse, reduced])

  const [readout, setReadout] = useState<ReadoutMessage | null>(null)
  const readoutTimer = useRef<number | undefined>(undefined)
  const showReadout = useCallback<RadarFieldValue['showReadout']>((text, tone = 'radar', action) => {
    window.clearTimeout(readoutTimer.current)
    const id = Date.now()
    setReadout({ id, text, tone, action })
    readoutTimer.current = window.setTimeout(
      () => setReadout((current) => (current?.id === id ? null : current)),
      (action ? 5.5 : durations.readout) * 1000
    )
  }, [])
  const dismissReadout = useCallback(() => setReadout(null), [])
  useEffect(() => () => window.clearTimeout(readoutTimer.current), [])

  const [flights, setFlights] = useState<SignalFlight[]>([])
  const flightLabels = useRef(new Map<number, string>())
  const launchSignal = useCallback(
    (from: Point, label: string) => {
      if (reduced) {
        firePulse()
        showReadout(label)
        haptic('capture')
        return
      }
      const id = Date.now()
      const core = getCore()
      flightLabels.current.set(id, label)
      setFlights((list) => [...list, { id, from, to: { x: core.x, y: core.y }, label }])
    },
    [reduced, firePulse, showReadout, getCore]
  )
  const landFlight = useCallback(
    (id: number) => {
      setFlights((list) => list.filter((flight) => flight.id !== id))
      const label = flightLabels.current.get(id)
      flightLabels.current.delete(id)
      firePulse()
      haptic('capture')
      if (label) showReadout(label)
    },
    [firePulse, showReadout]
  )

  const value = useMemo<RadarFieldValue>(
    () => ({
      geometry,
      model,
      tab,
      coreX,
      coreY,
      coreS,
      coreScale,
      dockProgress,
      tension,
      pulse,
      scrollVelocity,
      getCore,
      firePulse,
      launchSignal,
      showReadout,
      readout,
      dismissReadout,
      flights,
      landFlight,
      waves
    }),
    [geometry, model, tab, coreX, coreY, coreS, coreScale, dockProgress, tension, pulse, scrollVelocity, getCore, firePulse, launchSignal, showReadout, readout, dismissReadout, flights, landFlight, waves]
  )

  return <RadarFieldContext.Provider value={value}>{children}</RadarFieldContext.Provider>
}

/** Scroll velocity in px/s, clamped so a fling never produces a violent reaction. */
function useVelocityClamped(source: MotionValue<number>) {
  const velocity = useVelocity(source)
  return useTransform(velocity, (v) => Math.max(-2400, Math.min(2400, v)))
}
