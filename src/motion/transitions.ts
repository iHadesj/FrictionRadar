import type { Variants } from 'framer-motion'
import { durations, ease } from './motionTokens'

export interface PageTransitionContext {
  /** Viewport point the new section is revealed from (the tapped node). */
  x: number
  y: number
  /** Radius that covers the whole viewport from the origin. */
  reach: number
  /** -1 moving left on the rail, 1 moving right. */
  dir: number
  /** reveal: mask grows from the origin. morph: shared elements carry the transition. */
  kind: 'reveal' | 'morph'
  reduced: boolean
}

export const pageVariants: Variants = {
  enter: (c: PageTransitionContext) => {
    if (c.reduced) return { opacity: 0 }
    if (c.kind === 'morph') return { opacity: 0, clipPath: 'none' }
    return { opacity: 1, clipPath: `circle(0px at ${c.x}px ${c.y}px)` }
  },
  center: (c: PageTransitionContext) => {
    if (c.reduced) return { opacity: 1, transition: { duration: durations.flash } }
    if (c.kind === 'morph') return { opacity: 1, transition: { duration: durations.base, ease: ease.out } }
    return {
      opacity: 1,
      clipPath: `circle(${c.reach}px at ${c.x}px ${c.y}px)`,
      transition: { clipPath: { duration: durations.reveal, ease: ease.inOut } },
      transitionEnd: { clipPath: 'none' }
    }
  },
  // The outgoing page leaves the flow immediately (absolute at the same spot): shared
  // layoutId elements can keep it mounted past its own exit, and it must never push
  // the incoming page down while that happens.
  exit: (c: PageTransitionContext) => {
    const outOfFlow = { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } as const
    if (c.reduced) return { ...outOfFlow, opacity: 0, transition: { duration: durations.flash } }
    return {
      ...outOfFlow,
      opacity: 0,
      x: -c.dir * 42,
      scale: 0.965,
      transition: { duration: durations.base, ease: ease.out }
    }
  }
}

/**
 * Mask reveal along a route: each step is uncovered top→bottom right after the
 * previous one, so the route reads as a line being drawn down through the form.
 */
export const routeReveal = (index: number, reduced: boolean) =>
  reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: durations.flash } } }
    : {
        initial: { clipPath: 'inset(0% 0% 100% 0%)' },
        animate: {
          clipPath: 'inset(0% 0% 0% 0%)',
          transition: { delay: 0.2 + index * 0.07, duration: 0.34, ease: ease.out },
          transitionEnd: { clipPath: 'none' }
        }
      }
