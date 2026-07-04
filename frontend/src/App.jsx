import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminEventEditPage } from './pages/AdminEventEditPage'
import { AdminEventNewPage } from './pages/AdminEventNewPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminParticipantsPage } from './pages/AdminParticipantsPage'
import { AdminRoomsPage } from './pages/AdminRoomsPage'
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
        <Route element={<AppLayout />}>
          <Route index element={<Navigate replace to="/map" />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventSearchPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path=":eventId" element={<EventDetailPage />} />
          <Route path=":eventId/:roomId" element={<RoomChatPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />} path="admin">
          <Route index element={<AdminDashboardPage />} />
          <Route path="events/new" element={<AdminEventNewPage />} />
          <Route path="events/:eventId" element={<AdminEventEditPage />} />
          <Route path="events/:eventId/rooms" element={<AdminRoomsPage />} />
          <Route path="events/:eventId/participants" element={<AdminParticipantsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
