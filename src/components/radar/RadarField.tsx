import { RadarContours } from './RadarContours'
import { RadarCore } from './RadarCore'

/**
 * The persistent field. Mounted once for the life of the app: navigation repositions
 * it, it is never unmounted or recreated between sections.
 */
export function RadarField({ covered }: { covered: boolean }) {
  return (
    <div className="radar-field" aria-hidden="true">
      <div className="field-noise" />
      <RadarContours />
      <RadarCore covered={covered} />
      <div className="field-vignette" />
    </div>
  )
}
