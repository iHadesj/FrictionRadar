import type { Viewport } from './useViewport'

export type AppTab = 'radar' | 'signals' | 'patterns' | 'settings'

export const TABS: AppTab[] = ['radar', 'signals', 'patterns', 'settings']

/** Height of the top system layer below the safe area. */
export const TOP_H = 58
/** Height of the curved navigation rail above the safe area. */
export const RAIL_H = 88

/** Where the radar core sits: screen centre + scale relative to the base radius R. */
export interface CorePose {
  x: number
  y: number
  s: number
}

export interface Point {
  x: number
  y: number
}

export interface FieldGeometry {
  vp: Viewport
  /** Base core radius (core assembly at scale 1). */
  R: number
  wide: boolean
  rail: { left: number; top: number; width: number }
  /** Core docked at the end of the navigation rail — thumb reach, every section. */
  dock: CorePose
  poses: Record<AppTab, CorePose>
  /** Scroll distance over which a section's pose recedes into the dock. */
  dockDistance: Record<AppTab, number>
  home: { titleTop: number; insightTop: number }
  patterns: { top: number; height: number }
  railNodes: Point[]
}

export const RAIL_NODE_T = [0.06, 0.33, 0.6, 0.86]

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Rail curve control points in rail-local coordinates. `bend` deforms it during navigation. */
export function railControls(width: number, bend = 0): [Point, Point, Point, Point] {
  return [
    { x: 14, y: 64 },
    { x: width * 0.34, y: 72 + bend * 9 },
    { x: width * 0.6, y: 52 - bend * 14 },
    { x: width - 84, y: 10 }
  ]
}

export function bezierPoint([p0, p1, p2, p3]: [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

/** Sub-curve from 0 to t (de Casteljau split) as an SVG path. */
export function bezierHead(ctrl: [Point, Point, Point, Point], t: number) {
  const [p0, p1, p2, p3] = ctrl
  const lerp = (a: Point, b: Point) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
  const q0 = lerp(p0, p1)
  const q1 = lerp(p1, p2)
  const q2 = lerp(p2, p3)
  const r0 = lerp(q0, q1)
  const r1 = lerp(q1, q2)
  const s = lerp(r0, r1)
  return `M${p0.x},${p0.y} C${q0.x},${q0.y} ${r0.x},${r0.y} ${s.x},${s.y}`
}

export function computeGeometry(vp: Viewport): FieldGeometry {
  const { w, h, safeTop, safeBottom } = vp
  const wide = w >= 1024
  const tablet = !wide && w >= 768
  const R = wide ? clamp(Math.min(w * 0.19, h * 0.3), 200, 280) : tablet ? 210 : clamp(w * 0.36, 118, 168)

  const railWidth = Math.min(w, 560)
  const rail = { left: (w - railWidth) / 2, top: h - safeBottom - RAIL_H, width: railWidth }
  const dock: CorePose = { x: rail.left + railWidth - 48, y: rail.top - 18, s: 42 / R }

  const top = safeTop + TOP_H
  const radar: CorePose = wide
    ? { x: w * 0.64, y: Math.max(top + R + 40, h * 0.47), s: 1 }
    : tablet
      ? { x: w * 0.63, y: top + R + 110, s: 1 }
      : { x: w * 0.66, y: top + R + 96, s: 1 }

  const patternsTop = top + 4
  const patternsHeight = wide ? 560 : Math.min(w * 1.04, 480)

  const poses: Record<AppTab, CorePose> = {
    radar,
    signals: wide
      ? { x: w * 0.84, y: top + R * 0.7, s: 0.78 }
      : { x: w - R * 0.24, y: top + R * 0.72 + 18, s: 0.7 },
    patterns: { x: w / 2, y: patternsTop + patternsHeight / 2, s: (wide ? 64 : 48) / R },
    settings: wide
      ? { x: w * 0.12, y: top + R * 1.1, s: 0.9 }
      : { x: R * 0.06, y: top + R * 0.95, s: 0.74 }
  }

  const railCtrl = railControls(railWidth)
  const railNodes = RAIL_NODE_T.map((t) => {
    const p = bezierPoint(railCtrl, t)
    return { x: rail.left + p.x, y: rail.top + p.y }
  })

  return {
    vp,
    R,
    wide,
    rail,
    dock,
    poses,
    dockDistance: { radar: h * 0.55, signals: 240, patterns: patternsHeight * 0.6, settings: 220 },
    // Wide screens read the annotation in the left column, clear of the rail.
    home: { titleTop: top + 10, insightTop: wide ? top + 330 : radar.y + R + 54 },
    patterns: { top: patternsTop, height: patternsHeight },
    railNodes
  }
}
