import { useEffect, useState } from 'react'

export interface Viewport {
  w: number
  h: number
  safeTop: number
  safeBottom: number
}

let probe: HTMLDivElement | null = null

function readSafeAreas() {
  if (!probe) {
    probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);'
    document.body.appendChild(probe)
  }
  const style = getComputedStyle(probe)
  return {
    safeTop: parseFloat(style.paddingTop) || 0,
    safeBottom: parseFloat(style.paddingBottom) || 0
  }
}

/**
 * Layout viewport (clientWidth/clientHeight) rather than innerHeight: on iOS the
 * layout viewport does not shrink when the keyboard opens, so the field does not
 * jump while the user types in the capture aperture.
 */
function measure(): Viewport {
  const root = document.documentElement
  return { w: root.clientWidth, h: root.clientHeight, ...readSafeAreas() }
}

export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>(measure)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measure()
        setViewport((prev) =>
          prev.w === next.w && prev.h === next.h && prev.safeTop === next.safeTop && prev.safeBottom === next.safeBottom
            ? prev
            : next
        )
      })
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return viewport
}
