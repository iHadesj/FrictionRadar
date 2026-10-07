/** LED cadence changes with connectivity; numbers mirror the field so the core is never the only source. */
export function SystemStatus({ online, todayCount, todayLoad }: { online: boolean; todayCount: number; todayLoad: number }) {
  return (
    <div className="system-status" role="status" aria-label={`${online ? 'Online' : 'Offline'}. Dados locais prontos. ${todayCount} sinais hoje, carga ${todayLoad}.`}>
      <span className={online ? 'system-status__led' : 'system-status__led is-offline'} aria-hidden="true" />
      <span className="system-status__lines" aria-hidden="true">
        <strong>{online ? 'LOCAL / READY' : 'OFFLINE / READY'}</strong>
        <span>
          FR//{String(todayCount).padStart(2, '0')} <i>LOAD {todayLoad}</i>
        </span>
      </span>
    </div>
  )
}
