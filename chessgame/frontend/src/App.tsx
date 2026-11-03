import { Routes, Route } from 'react-router-dom'
import ChessTournament from './ChessTournamentComplete'
import { TournamentListPage } from './pages/TournamentListPage'
import { TournamentPublicPage } from './pages/TournamentPublicPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminTournamentPage } from './pages/AdminTournamentPage'
import { CreateTournamentPage } from './pages/CreateTournamentPage'
import { ParticipantPage } from './pages/ParticipantPage'
import { OnlineArenaPage } from './pages/OnlineArenaPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TournamentListPage />} />
      <Route path="/tournaments/:id" element={<TournamentPublicPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/tournaments/new" element={<CreateTournamentPage />} />
      <Route path="/admin/tournaments/:id" element={<AdminTournamentPage />} />
      <Route path="/participant" element={<ParticipantPage />} />
      {/* Online Chess Arena: Real-Time Live Multiplayer */}
      <Route path="/arena" element={<OnlineArenaPage />} />
      <Route path="/arena/:roomId" element={<OnlineArenaPage />} />
      {/* Legacy standalone mode — keep accessible */}
      <Route path="/standalone" element={<ChessTournament />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
