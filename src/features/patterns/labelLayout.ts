import type { Point } from '../../app/geometry'

export interface LabelBox {
  x: number
  y: number
  w: number
  h: number
  align: 'left' | 'right' | 'center'
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface ClusterSpot {
  at: Point
  size: number
}

export const LABEL_W = 116
const LABEL_H = 42
const PAD = 3
const OFFSETS = [0, -14, 14, -28, 28, -42, 42, -56, 56]

function overlap(a: Rect, b: Rect) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + PAD
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + PAD
  return ox > 0 && oy > 0 ? ox * oy : 0
}

/**
 * Collision-free cluster readings. Spots are given heaviest first; each reading tries
 * candidate slots around its own mass (outward side, opposite side, below, above,
 * with small vertical offsets) and keeps the first one that stays inside the field
 * and clear of the title, other masses and readings already placed.
 */
export function layoutLabels(spots: ClusterSpot[], field: { width: number; height: number; cx: number }, title: Rect): LabelBox[] {
  const masses: Rect[] = spots.map(({ at, size }) => ({ x: at.x - size / 2, y: at.y - size / 2, w: size, h: size }))
  const placed: LabelBox[] = []

  spots.forEach(({ at, size }, index) => {
    const outward: 'left' | 'right' = at.x < field.cx ? 'left' : 'right'
    const sides: Array<'left' | 'right'> = outward === 'left' ? ['left', 'right'] : ['right', 'left']
    const candidates: LabelBox[] = []
    for (const dy of OFFSETS) {
      for (const side of sides) {
        const x = side === 'right' ? at.x + size / 2 + 8 : at.x - size / 2 - 8 - LABEL_W
        candidates.push({ x, y: at.y - LABEL_H / 2 + dy, w: LABEL_W, h: LABEL_H, align: side })
      }
    }
    candidates.push({ x: at.x - LABEL_W / 2, y: at.y + size / 2 + 4, w: LABEL_W, h: LABEL_H, align: 'center' })
    candidates.push({ x: at.x - LABEL_W / 2, y: at.y - size / 2 - 4 - LABEL_H, w: LABEL_W, h: LABEL_H, align: 'center' })

    const inside = (c: LabelBox) => c.x >= 4 && c.y >= 2 && c.x + c.w <= field.width - 4 && c.y + c.h <= field.height - 2
    const cost = (c: LabelBox) =>
      overlap(c, title) * 4 +
      placed.reduce((sum, p) => sum + overlap(c, p) * 3, 0) +
      masses.reduce((sum, m, i) => (i === index ? sum : sum + overlap(c, m)), 0)

    let best: LabelBox | null = null
    let bestCost = Infinity
    for (const candidate of candidates) {
      if (!inside(candidate)) continue
      const c = cost(candidate)
      if (c === 0) {
        best = candidate
        break
      }
      if (c < bestCost) {
        bestCost = c
        best = candidate
      }
    }
    // Nothing fits inside: clamp the outward slot into the field.
    placed.push(
      best ?? {
        ...candidates[0],
        x: Math.max(4, Math.min(field.width - LABEL_W - 4, candidates[0].x)),
        y: Math.max(2, Math.min(field.height - LABEL_H - 2, candidates[0].y))
      }
    )
  })
  return placed
}
