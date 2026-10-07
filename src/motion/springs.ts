import type { Transition } from 'framer-motion'

/**
 * Spring vocabulary. Short inertia, no toy bounce.
 * field   — the persistent radar field repositioning between sections.
 * gesture — objects following the finger / releasing from a drag.
 * settle  — layout redistributions (nodes making room, clusters moving).
 * snap    — tiny state confirmations (indicator dots, toggles).
 * aperture— the core opening into the capture surface.
 */
export const springs = {
  field: { type: 'spring', stiffness: 120, damping: 24, mass: 0.9 },
  gesture: { type: 'spring', stiffness: 300, damping: 30, mass: 0.6 },
  settle: { type: 'spring', stiffness: 180, damping: 30, mass: 1 },
  snap: { type: 'spring', stiffness: 520, damping: 38, mass: 0.5 },
  aperture: { type: 'spring', stiffness: 150, damping: 24, mass: 0.8 }
} satisfies Record<string, Transition>

export const instant: Transition = { duration: 0 }
