/** Cubic-bezier easings used when a duration-based tween reads better than a spring. */
export const ease = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  scan: [0.4, 0, 0.2, 1],
  dissolve: [0.5, 0, 0.75, 0]
} as const

/** Seconds. Kept short: the app is used many times a day. */
export const durations = {
  flash: 0.12,
  quick: 0.22,
  base: 0.36,
  reveal: 0.6,
  travel: 0.62,
  readout: 2.6
} as const

/**
 * Four motion layers:
 * ambient    — near-imperceptible breathing/drift, disabled in low power or reduced motion.
 * state      — data-driven reactions (pulse on capture, compression under load).
 * navigation — spatial transformations between sections.
 * gesture    — direct manipulation, follows the finger.
 */
export type MotionLayer = 'ambient' | 'state' | 'navigation' | 'gesture'

export const ambient = {
  breathe: 4.6,
  noiseDrift: 42,
  scanRevolution: 5.2
} as const
