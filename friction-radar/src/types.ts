export type FrictionCategory =
  | 'WORK'
  | 'DEV'
  | 'HOME'
  | 'ADMIN'
  | 'ERRANDS'
  | 'PERSONAL'

export type FrictionContext = 'DESK' | 'MOBILE' | 'OUT' | 'HOME' | 'ANYWHERE'

export interface FrictionEntry {
  id?: number
  title: string
  category: FrictionCategory
  intensity: 1 | 2 | 3 | 4 | 5
  minutes: number
  context: FrictionContext
  note?: string
  createdAt: string
}

export interface AppPreferences {
  reducedMotion: boolean
  lowPowerMode: boolean
  show3D: boolean
}
