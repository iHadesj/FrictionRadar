import { createContext, useContext } from 'react'
import type { AppPreferences } from '../types'

export type IntroMode = 'full' | 'short' | 'none'

export interface MotionPreferences {
  prefs: AppPreferences
  setPrefs: (next: AppPreferences) => void
  /** System prefers-reduced-motion OR the in-app preference. */
  reduced: boolean
  lowPower: boolean
  show3D: boolean
  /** How the entry choreography plays for this mount. */
  intro: IntroMode
}

export const MotionPreferencesContext = createContext<MotionPreferences | null>(null)

export function useMotionPreferences() {
  const value = useContext(MotionPreferencesContext)
  if (!value) throw new Error('useMotionPreferences must be used inside <MotionProvider>')
  return value
}
