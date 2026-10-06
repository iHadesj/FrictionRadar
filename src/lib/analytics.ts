import type { FrictionEntry } from '../types'

export function normalizeSignature(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isToday(iso: string) {
  const a = new Date(iso)
  const b = new Date()
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function frictionLoad(entry: FrictionEntry) {
  return entry.minutes * entry.intensity
}

export function summarize(entries: FrictionEntry[]) {
  const today = entries.filter((entry) => isToday(entry.createdAt))
  const todayMinutes = today.reduce((sum, entry) => sum + entry.minutes, 0)
  const todayLoad = today.reduce((sum, entry) => sum + frictionLoad(entry), 0)

  const categoryMap = new Map<string, { count: number; minutes: number; load: number }>()
  const titleMap = new Map<
    string,
    { title: string; count: number; minutes: number; load: number; intensity: number }
  >()

  for (const entry of entries) {
    const category = categoryMap.get(entry.category) ?? { count: 0, minutes: 0, load: 0 }
    category.count += 1
    category.minutes += entry.minutes
    category.load += frictionLoad(entry)
    categoryMap.set(entry.category, category)

    const key = normalizeSignature(entry.title)
    if (!key) continue
    const title = titleMap.get(key) ?? {
      title: entry.title,
      count: 0,
      minutes: 0,
      load: 0,
      intensity: 0
    }
    title.count += 1
    title.minutes += entry.minutes
    title.load += frictionLoad(entry)
    title.intensity += entry.intensity
    titleMap.set(key, title)
  }

  const topCategories = [...categoryMap.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.load - a.load)

  const hotspots = [...titleMap.values()]
    .map((item) => ({ ...item, avgIntensity: item.intensity / item.count }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 8)

  return { today, todayMinutes, todayLoad, topCategories, hotspots }
}

export function buildInsight(entries: FrictionEntry[]) {
  if (entries.length < 3) return 'Registre mais alguns atritos para o radar formar um padrao confiavel.'

  const { topCategories, hotspots } = summarize(entries)
  const totalLoad = entries.reduce((sum, entry) => sum + frictionLoad(entry), 0)
  const top = topCategories[0]
  const hotspot = hotspots[0]

  if (hotspot && hotspot.count >= 3) {
    return `“${hotspot.title}” ja apareceu ${hotspot.count}x e acumulou ${hotspot.minutes} min. E um bom candidato para eliminar, automatizar ou documentar.`
  }

  if (top && totalLoad > 0) {
    const share = Math.round((top.load / totalLoad) * 100)
    return `${top.name} concentra ${share}% da carga de atrito registrada. Comece por esse contexto antes de otimizar o resto.`
  }

  return 'O radar ainda esta coletando sinal. Continue registrando sem tentar organizar demais.'
}
