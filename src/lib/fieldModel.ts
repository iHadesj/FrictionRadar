import { normalizeSignature, type summarize } from './analytics'

type Summary = ReturnType<typeof summarize>

export interface PressureZone {
  key: string
  title: string
  /** Radians, screen orientation (0 = right, clockwise). */
  angle: number
  /** 0..1 — how hard the zone dents the field. */
  strength: number
}

export interface FieldModel {
  /** 0..1 today's load, the field compresses as it rises. */
  severity: number
  todayCount: number
  avgIntensity: number
  zones: PressureZone[]
}

/** Fixed by rank so the strongest zone always sits lower-left, where the readout leader starts. */
export const ZONE_ANGLES = [125, 22, 248, 318].map((deg) => (deg * Math.PI) / 180)

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const hotspotKey = (title: string) => normalizeSignature(title) || title

export function buildFieldModel(summary: Summary): FieldModel {
  const maxLoad = Math.max(summary.hotspots[0]?.load ?? 0, 60)
  const zones = summary.hotspots.slice(0, ZONE_ANGLES.length).map((spot, index) => ({
    key: hotspotKey(spot.title),
    title: spot.title,
    angle: ZONE_ANGLES[index],
    strength: clamp((spot.load / maxLoad) * (spot.count >= 3 ? 1 : 0.75), 0.12, 1)
  }))
  const intensitySum = summary.today.reduce((sum, entry) => sum + entry.intensity, 0)
  return {
    severity: clamp(summary.todayLoad / 250, 0, 1),
    todayCount: summary.today.length,
    avgIntensity: summary.today.length ? intensitySum / summary.today.length : 0,
    zones
  }
}

/** Ring spacing widens outward like terrain flattening away from a peak. */
export const ringFactor = (i: number) => 1.15 + 0.3 * i + 0.035 * i * i

type Pt = [number, number]

function angleDiff(a: number, b: number) {
  const d = Math.atan2(Math.sin(a - b), Math.cos(a - b))
  return d
}

function radiusAt(theta: number, base: number, ring: number, zones: PressureZone[]) {
  let f = 1 + 0.02 * Math.sin(3 * theta + ring * 1.3) + 0.012 * Math.sin(5 * theta + ring * 2.1)
  for (const zone of zones) {
    const d = angleDiff(theta, zone.angle)
    f -= (zone.strength * 0.15 * Math.exp(-((d / 0.45) ** 2))) / (1 + ring * 0.22)
  }
  return base * f
}

const round = (v: number) => Math.round(v * 10) / 10

/** Catmull-Rom → cubic Bézier, closed or open. */
function smoothPath(points: Pt[], closed: boolean) {
  const n = points.length
  if (n < 2) return ''
  const at = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))])
  let d = `M${round(points[0][0])},${round(points[0][1])}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2[0])},${round(p2[1])}`
  }
  return closed ? `${d} Z` : d
}

export interface ContourRing {
  index: number
  d: string
  /** Red stretches of this ring where pressure zones dent it. */
  arcs: Array<{ d: string; strength: number }>
}

/** Field contours around the core, deformed by pressure zones and compressed by load. */
export function buildContours(R: number, model: FieldModel, ringIndices: number[], samples: number): ContourRing[] {
  return ringIndices.map((i) => {
    const base = R * ringFactor(i) * (1 - 0.12 * model.severity * Math.exp(-i * 0.3))
    const points: Pt[] = []
    for (let k = 0; k < samples; k += 1) {
      const theta = (k / samples) * Math.PI * 2
      const r = radiusAt(theta, base, i, model.zones)
      points.push([Math.cos(theta) * r, Math.sin(theta) * r])
    }
    const arcs = i > 5
      ? []
      : model.zones
          .filter((zone) => zone.strength > 0.15)
          .map((zone) => {
            const arcPoints: Pt[] = []
            const span = 0.5
            for (let k = 0; k <= 10; k += 1) {
              const theta = zone.angle - span + (k / 10) * span * 2
              const r = radiusAt(theta, base, i, model.zones)
              arcPoints.push([Math.cos(theta) * r, Math.sin(theta) * r])
            }
            return { d: smoothPath(arcPoints, false), strength: zone.strength * (1 - i * 0.15) }
          })
    return { index: i, d: smoothPath(points, true), arcs }
  })
}

/** Deterministic 0..1 hash for stable per-item jitter. */
export function hash01(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/** Irregular closed outline for clusters/craters. */
export function blobPath(radius: number, seed: string, wobble = 0.12, samples = 18) {
  const s = hash01(seed) * Math.PI * 2
  const points: Pt[] = []
  for (let k = 0; k < samples; k += 1) {
    const theta = (k / samples) * Math.PI * 2
    const f = 1 + wobble * (0.6 * Math.sin(3 * theta + s) + 0.4 * Math.sin(5 * theta + s * 1.7))
    points.push([Math.cos(theta) * radius * f, Math.sin(theta) * radius * f])
  }
  return smoothPath(points, true)
}

export function polar(angle: number, radius: number) {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}
