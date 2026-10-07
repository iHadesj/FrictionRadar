import { MotionConfig, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MotionPreferencesContext, type IntroMode } from '../motion/useMotionPreferences'
import type { AppPreferences } from '../types'

const PREFS_KEY = 'friction-radar:prefs'
const INTRO_KEY = 'friction-radar:intro-played'

const defaultPrefs: AppPreferences = {
  reducedMotion: false,
  lowPowerMode: true,
  show3D: true
}

function readPrefs(): AppPreferences {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return defaultPrefs
  }
}

/** Full choreography once per session; a short settle on later mounts. */
function readIntro(): IntroMode {
  try {
    if (sessionStorage.getItem(INTRO_KEY)) return 'short'
    sessionStorage.setItem(INTRO_KEY, '1')
    return 'full'
  } catch {
    return 'short'
  }
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion()
  const [prefs, setPrefs] = useState<AppPreferences>(readPrefs)
  const [intro, setIntro] = useState<IntroMode>(readIntro)

  // After the entry choreography, anything that mounts later (returning to a
  // section) uses the short settle instead of replaying the full intro.
  useEffect(() => {
    if (intro !== 'full') return
    const timer = window.setTimeout(() => setIntro('short'), 1200)
    return () => window.clearTimeout(timer)
  }, [intro])

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // Storage can be unavailable (private mode); preferences then live for the session.
    }
  }, [prefs])

  const reduced = Boolean(systemReduced || prefs.reducedMotion)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motion = reduced ? 'reduced' : 'full'
    root.dataset.power = prefs.lowPowerMode ? 'low' : 'high'
  }, [reduced, prefs.lowPowerMode])

  const value = useMemo(
    () => ({
      prefs,
      setPrefs,
      reduced,
      lowPower: prefs.lowPowerMode,
      show3D: prefs.show3D,
      intro: reduced ? ('none' as const) : intro
    }),
    [prefs, reduced, intro]
  )

  return (
    <MotionPreferencesContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </MotionPreferencesContext.Provider>
  )
}
