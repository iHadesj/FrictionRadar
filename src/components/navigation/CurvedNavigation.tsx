import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { RAIL_H, RAIL_NODE_T, TABS, bezierHead, bezierPoint, railControls, type AppTab, type FieldGeometry } from '../../app/geometry'
import { haptic } from '../../lib/haptics'
import { springs } from '../../motion/springs'
import { useMotionPreferences } from '../../motion/useMotionPreferences'

const LABELS: Record<AppTab, string> = {
  radar: 'RADAR',
  signals: 'SINAIS',
  patterns: 'PADRÕES',
  settings: 'CONTROLE'
}

interface CurvedNavigationProps {
  active: AppTab
  geometry: FieldGeometry
  onNavigate: (tab: AppTab, origin: { x: number; y: number }) => void
}

/**
 * Curved navigation rail. The active indicator travels physically along the curve;
 * the curve flexes briefly in the direction of travel and flows into the docked core.
 */
export function CurvedNavigation({ active, geometry, onNavigate }: CurvedNavigationProps) {
  const { reduced } = useMotionPreferences()
  const width = geometry.rail.width
  const activeIndex = TABS.indexOf(active)

  const progress = useMotionValue(activeIndex)
  const bend = useMotionValue(0)
  const previous = useRef(activeIndex)

  useEffect(() => {
    const dir = Math.sign(activeIndex - previous.current)
    previous.current = activeIndex
    if (reduced) {
      progress.set(activeIndex)
      return
    }
    const travel = animate(progress, activeIndex, springs.field)
    let flex: ReturnType<typeof animate> | undefined
    if (dir !== 0) {
      bend.set(dir)
      flex = animate(bend, 0, { ...springs.gesture, damping: 14 })
    }
    return () => {
      travel.stop()
      flex?.stop()
    }
  }, [activeIndex, reduced, progress, bend])

  const toT = (p: number) => {
    const i = Math.max(0, Math.min(RAIL_NODE_T.length - 2, Math.floor(p)))
    const f = Math.max(0, Math.min(1, p - i))
    return RAIL_NODE_T[i] + (RAIL_NODE_T[i + 1] - RAIL_NODE_T[i]) * f
  }

  const railD = useTransform(bend, (b) => {
    const [p0, p1, p2, p3] = railControls(width, b)
    return `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`
  })
  const headD = useTransform([progress, bend], ([p, b]: number[]) => bezierHead(railControls(width, b), toT(p)))
  const dotX = useTransform([progress, bend], ([p, b]: number[]) => bezierPoint(railControls(width, b), toT(p)).x)
  const dotY = useTransform([progress, bend], ([p, b]: number[]) => bezierPoint(railControls(width, b), toT(p)).y)

  const nodes = RAIL_NODE_T.map((t) => bezierPoint(railControls(width), t))
  const end = railControls(width)[3]

  return (
    <nav
      className="curved-nav"
      aria-label="Navegação principal"
      style={{ left: geometry.rail.left, width, top: geometry.rail.top, height: RAIL_H }}
    >
      <svg className="curved-nav__rail" width={width} height={RAIL_H} aria-hidden="true">
        <motion.path d={railD} className="curved-nav__track" />
        <motion.path d={headD} className="curved-nav__trace" />
        <path d={`M${end.x},${end.y} L${end.x + 14},${end.y - 10}`} className="curved-nav__terminal" />
        {nodes.map((node, index) => (
          <circle key={index} cx={node.x} cy={node.y} r={3.2} className={index === activeIndex ? 'curved-nav__node is-active' : 'curved-nav__node'} />
        ))}
        <motion.circle cx={dotX} cy={dotY} r={7} className="curved-nav__indicator" />
        <motion.circle cx={dotX} cy={dotY} r={2.4} className="curved-nav__indicator-core" />
      </svg>
      {TABS.map((tab, index) => {
        const node = nodes[index]
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            className={isActive ? 'curved-nav__item is-active' : 'curved-nav__item'}
            style={{ left: node.x - 32, top: node.y - 22 }}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (isActive) {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
                return
              }
              haptic('step')
              onNavigate(tab, { x: geometry.rail.left + node.x, y: geometry.rail.top + node.y })
            }}
          >
            <span className="curved-nav__label">{LABELS[tab]}</span>
          </button>
        )
      })}
    </nav>
  )
}
