export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`} aria-label="Friction Radar">
      <span className="brand-mark__scope" aria-hidden="true">
        <span className="brand-mark__ring brand-mark__ring--a" />
        <span className="brand-mark__ring brand-mark__ring--b" />
        <span className="brand-mark__dot" />
        <span className="brand-mark__slash" />
      </span>
      {!compact && (
        <span className="brand-mark__type">
          <strong>FRICTION</strong>
          <em>RADAR</em>
        </span>
      )}
    </div>
  )
}
