import { NavLink, Outlet } from 'react-router-dom'

const adminNavItems = [
  { to: '/admin', label: 'ダッシュボード', end: true },
  { to: '/admin/events/new', label: 'イベント作成' },
  { to: '/map', label: 'ユーザー画面' },
]

function navClassName({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-rose-700 text-white'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950',
  ].join(' ')
}

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <NavLink className="text-lg font-semibold tracking-normal text-stone-950" to="/admin">
            HACKBASE Admin
          </NavLink>
          <nav className="flex flex-wrap gap-2">
            {adminNavItems.map((item) => (
              <NavLink className={navClassName} end={item.end} key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
