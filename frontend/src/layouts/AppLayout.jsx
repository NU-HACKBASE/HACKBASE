import { Outlet, useLocation } from 'react-router-dom'

import { AppFooter } from '../components/AppFooter'

export function AppLayout() {
  const location = useLocation()
  const isMapPage = location.pathname === '/map' || location.pathname === '/'

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50">
      <main
        className={
          isMapPage
            ? 'min-h-screen pb-24'
            : 'mx-auto min-h-screen max-w-6xl px-4 py-6 pb-28'
        }
      >
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
