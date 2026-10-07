/**
 * Sparse haptic punctuation. Never the only feedback; silently a no-op where
 * navigator.vibrate is unavailable (including iOS Safari) or motion is reduced.
 */
const patterns = {
  capture: [14, 40, 22],
  step: 8,
  snap: 12,
  discard: [10, 30, 10]
} as const

export type HapticKind = keyof typeof patterns

export function haptic(kind: HapticKind) {
  if (document.documentElement.dataset.motion === 'reduced') return
  const nav = navigator as Navigator & { vibrate?: (pattern: number | readonly number[]) => boolean }
  try {
    nav.vibrate?.(patterns[kind] as number | number[])
  } catch {
    // Some browsers throw when vibration is blocked by policy.
  }
}
