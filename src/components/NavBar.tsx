export type AppTab = 'radar' | 'signals' | 'patterns' | 'settings'

const items: Array<{ id: AppTab; label: string; glyph: string }> = [
  { id: 'radar', label: 'RADAR', glyph: '◎' },
  { id: 'signals', label: 'SINAIS', glyph: '≡' },
  { id: 'patterns', label: 'PADROES', glyph: '⌁' },
  { id: 'settings', label: 'AJUSTES', glyph: '⊙' }
]

export function NavBar({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav className="app-nav" aria-label="Navegacao principal">
      {items.map((item) => (
        <button key={item.id} className={active === item.id ? 'app-nav__item is-active' : 'app-nav__item'} onClick={() => onChange(item.id)}>
          <span aria-hidden="true">{item.glyph}</span>
          <em>{item.label}</em>
        </button>
      ))}
    </nav>
  )
}
