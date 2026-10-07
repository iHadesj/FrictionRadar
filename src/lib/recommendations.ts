import type { summarize } from './analytics'

type Hotspot = ReturnType<typeof summarize>['hotspots'][number]

/** Plain-language next actions for a hotspot, derived from its recurrence, cost and intensity. */
export function recommendationsFor(spot: Hotspot): string[] {
  const out: string[] = []
  if (spot.count >= 3) out.push('Repetiu 3x ou mais: documente o passo a passo ou automatize de vez.')
  if (spot.avgIntensity >= 4) out.push('Intensidade alta: ataque a causa antes de otimizar o resto.')
  if (spot.minutes >= 30) out.push(`Já custou ${spot.minutes} min: vale bloquear um tempo para eliminar.`)
  if (spot.count < 3 && spot.minutes < 30) out.push('Ainda é um sinal isolado: continue registrando para confirmar o padrão.')
  if (out.length < 3) out.push('Pergunte: dá para delegar, mover para outro momento ou simplesmente parar de fazer?')
  return out.slice(0, 3)
}
