import { motion } from 'framer-motion'
import type { Point } from '../../app/geometry'
import { Crater } from '../../components/radar/Crater'
import type { summarize } from '../../lib/analytics'
import { springs } from '../../motion/springs'
import type { LabelBox } from './labelLayout'

type Hotspot = ReturnType<typeof summarize>['hotspots'][number]

export interface ClusterLayout {
  key: string
  spot: Hotspot
  strength: number
  size: number
  home: Point
}

interface HotspotClusterProps {
  item: ClusterLayout
  at: Point
  index: number
  focused: boolean
  dimmed: boolean
  /** Collision-free reading position in field coordinates (see labelLayout). */
  label: LabelBox
  onSelect: () => void
}

/** A cluster: crater (shared layoutId with Home) + its reading, as one real button. */
export function HotspotCluster({ item, at, index, focused, dimmed, label, onSelect }: HotspotClusterProps) {
  const { spot, strength, key } = item
  const size = focused ? Math.max(item.size * 1.5, 72) : item.size
  const labelStyle = focused
    ? { ['--offset' as string]: `${size / 2 + 8}px` }
    : { left: label.x - at.x, top: label.y - at.y, width: label.w }

  return (
    <motion.button
      type="button"
      className={`cluster${focused ? ' cluster--below is-focused' : ` cluster--${label.align}`}${dimmed ? ' is-dimmed' : ''}`}
      initial={false}
      animate={{ x: at.x, y: at.y }}
      transition={springs.settle}
      onClick={onSelect}
      aria-pressed={focused}
      aria-label={`${spot.title}: ${spot.count} ocorrências, ${spot.minutes} minutos, carga ${spot.load}.`}
      style={{ ['--wobble' as string]: `${(1 + strength * 3).toFixed(1)}px`, ['--wobble-delay' as string]: `${-index * 0.7}s` }}
    >
      <span className="cluster__mass" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
        <Crater spotKey={key} size={size} strength={strength} />
      </span>
      <span className="cluster__label" style={labelStyle} aria-hidden="true">
        <strong>{spot.title}</strong>
        <span>
          {spot.count}× · {spot.minutes}MIN · {spot.load}LD
        </span>
      </span>
    </motion.button>
  )
}
