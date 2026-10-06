import Dexie, { type EntityTable } from 'dexie'
import type { FrictionEntry } from '../types'

export const db = new Dexie('friction-radar') as Dexie & {
  frictions: EntityTable<FrictionEntry, 'id'>
}

db.version(1).stores({
  frictions: '++id, createdAt, category, intensity, context, title'
})

export async function listFrictions(): Promise<FrictionEntry[]> {
  return db.frictions.orderBy('createdAt').reverse().toArray()
}

export async function addFriction(entry: Omit<FrictionEntry, 'id'>) {
  return db.frictions.add(entry)
}

export async function deleteFriction(id: number) {
  return db.frictions.delete(id)
}

export async function exportDatabase() {
  const frictions = await db.frictions.toArray()
  return JSON.stringify(
    {
      app: 'Friction Radar',
      version: 1,
      exportedAt: new Date().toISOString(),
      frictions
    },
    null,
    2
  )
}

export async function importDatabase(json: string) {
  const payload = JSON.parse(json) as { frictions?: FrictionEntry[] }
  if (!Array.isArray(payload.frictions)) throw new Error('Arquivo invalido')
  await db.transaction('rw', db.frictions, async () => {
    await db.frictions.clear()
    await db.frictions.bulkAdd(payload.frictions.map(({ id: _id, ...entry }) => entry))
  })
}
