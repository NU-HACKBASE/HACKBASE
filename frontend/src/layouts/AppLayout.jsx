import { NavLink, Outlet } from 'react-router-dom'

import { DevStatus } from '../components/DevStatus'

const navItems = [
  { to: '/map', label: 'マップ' },
  { to: '/events', label: 'イベント' },
  { to: '/profile', label: 'プロフィール' },
]

function navClassName({ isActive }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-teal-700 text-white'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950',
  ].join(' ')
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <NavLink className="text-lg font-semibold tracking-normal text-stone-950" to="/map">
            HACKBASE
          </NavLink>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink className={navClassName} key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
            <NavLink className={navClassName} to="/admin">
              管理
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-153px)] max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <DevStatus />
    </div>
  )
}
