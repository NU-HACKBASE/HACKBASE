import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { UserProvider } from './contexts/UserContext'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventSearchPage } from './pages/EventSearchPage'
import { MapPage } from './pages/MapPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RoomChatPage } from './pages/RoomChatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <UserProvider>
              <AppLayout />
            </UserProvider>
          }
        >
          <Route index element={<Navigate replace to="/map" />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventSearchPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path=":eventId" element={<EventDetailPage />} />
          <Route path=":eventId/:roomId" element={<RoomChatPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />} path="admin/*">
          <Route index element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate replace to="/admin" />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
