import { NavLink } from 'react-router-dom'

const footerItems = [
  { to: '/map', label: 'マップ', icon: MapIcon },
  { to: '/events', label: 'イベント', icon: CalendarIcon },
  { to: '/profile', label: 'プロフィール', icon: ProfileIcon },
]

function footerLinkClassName({ isActive }) {
  return [
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition',
    isActive ? 'text-violet-300' : 'text-slate-400 hover:text-slate-100',
  ].join(' ')
}

export function AppFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-[1200] border-t border-white/10 bg-slate-950/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl shadow-black/40 backdrop-blur">
      <nav className="mx-auto flex max-w-md items-center justify-between gap-2">
        {footerItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink className={footerLinkClassName} key={item.to} to={item.to}>
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </footer>
  )
}

function MapIcon({ active }) {
  return (
    <span className="flex h-7 w-7 items-end justify-center gap-1" aria-hidden="true">
      <span
        className={`h-5 w-2 rounded-sm ${active ? 'bg-violet-400' : 'bg-slate-400'}`}
      />
      <span
        className={`h-6 w-2 rounded-sm ${active ? 'bg-violet-300' : 'bg-slate-300'}`}
      />
      <span
        className={`h-4 w-2 rounded-sm ${active ? 'bg-violet-500' : 'bg-slate-500'}`}
      />
    </span>
  )
}

function CalendarIcon({ active }) {
  return (
    <span
      className={`relative h-7 w-7 rounded-md border-2 ${active ? 'border-violet-300' : 'border-slate-400'}`}
      aria-hidden="true"
    >
      <span
        className={`absolute left-1 top-2 h-0.5 w-4 ${active ? 'bg-violet-300' : 'bg-slate-400'}`}
      />
      <span
        className={`absolute left-1.5 top-4 h-1 w-1 rounded-full ${active ? 'bg-violet-300' : 'bg-slate-400'}`}
      />
      <span
        className={`absolute right-1.5 top-4 h-1 w-1 rounded-full ${active ? 'bg-violet-300' : 'bg-slate-400'}`}
      />
    </span>
  )
}

function ProfileIcon({ active }) {
  return (
    <span className="relative h-7 w-7" aria-hidden="true">
      <span
        className={`absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full ${active ? 'bg-violet-300' : 'bg-slate-400'}`}
      />
      <span
        className={`absolute bottom-0 left-1/2 h-4 w-6 -translate-x-1/2 rounded-t-full ${active ? 'bg-violet-300' : 'bg-slate-400'}`}
      />
    </span>
  )
}
