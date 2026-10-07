import { useCallback, useEffect, useState } from 'react'
import { addFriction, deleteFriction, exportDatabase, importDatabase, listFrictions } from '../lib/db'
import { updateAppBadge } from '../lib/notifications'
import type { FrictionEntry } from '../types'

export type NewFriction = Omit<FrictionEntry, 'id' | 'createdAt'>

/** Thin React layer over the Dexie contract in lib/db — persistence logic stays there. */
export function useFrictionStore() {
  const [entries, setEntries] = useState<FrictionEntry[]>([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const data = await listFrictions()
    setEntries(data)
    setReady(true)
    const highPriority = data.filter((entry) => entry.intensity >= 4).slice(0, 9).length
    await updateAppBadge(highPriority)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(
    async (entry: NewFriction) => {
      const id = await addFriction({ ...entry, createdAt: new Date().toISOString() })
      await refresh()
      return id as number
    },
    [refresh]
  )

  const remove = useCallback(
    async (id?: number) => {
      if (!id) return
      await deleteFriction(id)
      await refresh()
    },
    [refresh]
  )

  /** Undo for a discard: re-adds the same record (keeps createdAt, receives a new id). */
  const restore = useCallback(
    async ({ id: _id, ...entry }: FrictionEntry) => {
      await addFriction(entry)
      await refresh()
    },
    [refresh]
  )

  const exportArchive = useCallback(async () => {
    const json = await exportDatabase()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `friction-radar-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  const importArchive = useCallback(
    async (file: File) => {
      await importDatabase(await file.text())
      await refresh()
    },
    [refresh]
  )

  return { entries, ready, save, remove, restore, exportArchive, importArchive }
}
