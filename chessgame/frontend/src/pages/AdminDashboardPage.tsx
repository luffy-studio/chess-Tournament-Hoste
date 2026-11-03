import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { Tournament } from '../types'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalLoading } from '../components/RoyalLoading'
import { RoyalEmpty } from '../components/RoyalEmpty'
import { StatusBadge } from '../components/StatusBadge'
import { ModeBadge } from '../components/ModeBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CopyButton } from '../components/CopyButton'
import { Plus, LogOut, Globe, Shield, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('chess_admin_token')
    if (!token) {
      navigate('/admin')
      return
    }
    fetchTournaments()
    fetchSystemInfo()
  }, [navigate])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/tournaments')
      setTournaments(res.data)
    } catch {
      toast.error('Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemInfo = async () => {
    try {
      const res = await api.get('/system/info')
      setSystemInfo(res.data)
    } catch {
      // system info is optional
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/tournaments/${deleteTarget}`)
      toast.success('Tournament record deleted')
      setTournaments((prev) => prev.filter((t) => t.id !== deleteTarget))
    } catch {
      toast.error('Failed to delete tournament')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('chess_admin_token')
    localStorage.removeItem('chess_admin_user')
    navigate('/admin')
  }

  const active = tournaments.filter((t) => t.status === 'ongoing' || (t.status as string) === 'ACTIVE').length
  const completed = tournaments.filter((t) => t.status === 'completed' || (t.status as string) === 'COMPLETED').length
  const hostIp =
    systemInfo?.localIP ||
    systemInfo?.localIp ||
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
  const lanUrl =
    typeof window !== 'undefined' && window.location.origin.includes('5173')
      ? `http://${hostIp}:5173`
      : `http://${hostIp}:5000`

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col selection:bg-[#B08401]/25 selection:text-[#683B2B]">
      <RoyalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Dashboard Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DED1BD] pb-6">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-semibold">
              Arbiter Operations Center
            </p>
            <h1 className="font-serif italic font-normal text-3xl sm:text-4xl lg:text-5xl text-[#683B2B] mt-1 tracking-tight">
              Championship <span className="text-[#B08401]">Console</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <RoyalButton to="/admin/tournaments/new" variant="primary">
              <Plus size={14} className="mr-1" /> Create Tournament
            </RoyalButton>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#DED1BD] bg-[#FFFFFF] hover:bg-[#FAF6F2] text-xs font-cinzel text-[#7A6658] hover:text-[#9E3B3B] transition shadow-sm font-semibold"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Minimalist Stats Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <RoyalCard>
            <p className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] font-semibold">
              Total Sanctioned
            </p>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#683B2B] mt-1.5 font-bold">
              {tournaments.length}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">Recorded in database ledger</p>
          </RoyalCard>

          <RoyalCard>
            <p className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] font-semibold">
              Active Rounds
            </p>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#5B6E57] mt-1.5 font-bold">
              {active}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">Under live arbitration</p>
          </RoyalCard>

          <RoyalCard>
            <p className="font-cinzel text-xs uppercase tracking-wider text-[#7A6658] font-semibold">
              Concluded & Ratified
            </p>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#B08401] mt-1.5 font-bold">
              {completed}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">With official winners declared</p>
          </RoyalCard>
        </div>

        {/* Layout with Main Ledger & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tournament List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DED1BD] pb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-serif italic text-2xl text-[#683B2B]">
                  Sanctioned Tournaments
                </h2>
                <button
                  onClick={fetchTournaments}
                  title="Refresh list"
                  className="p-1.5 rounded-full hover:bg-[#FAF6F2] text-[#7A6658] hover:text-[#B08401] transition"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <span className="font-cinzel text-xs text-[#7A6658] font-semibold">
                {tournaments.length} Fixtures
              </span>
            </div>

            {loading ? (
              <RoyalLoading message="Retrieving championship records…" />
            ) : tournaments.length === 0 ? (
              <RoyalEmpty
                title="No Tournaments Created"
                description="Click below to set up your first Swiss or Round Robin championship."
                actionLabel="Create Tournament"
                actionTo="/admin/tournaments/new"
              />
            ) : (
              <div className="space-y-4">
                {tournaments.map((t) => (
                  <RoyalCard key={t.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif italic text-xl text-[#683B2B] font-medium">
                            {t.name}
                          </h3>
                          <StatusBadge status={t.status} />
                          <ModeBadge mode={t.mode} />
                        </div>
                        <p className="font-cinzel text-xs text-[#7A6658]">
                          {t.participants?.length ?? 0} Enrolled Players · Round {t.currentRound} of {t.roundsPlanned}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <RoyalButton
                          to={`/tournaments/${t.id}`}
                          variant="secondary"
                          className="text-xs py-1.5 px-3"
                        >
                          Public
                        </RoyalButton>
                        <RoyalButton
                          to={`/admin/tournaments/${t.id}`}
                          variant="primary"
                          className="text-xs py-1.5 px-3.5"
                        >
                          Arbiter Board
                        </RoyalButton>
                        <button
                          onClick={() => setDeleteTarget(t.id)}
                          className="px-3 py-1.5 rounded-full border border-[#9E3B3B]/30 bg-[#FFFFFF] hover:bg-[#9E3B3B]/10 text-xs font-cinzel text-[#9E3B3B] transition font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </RoyalCard>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Venue LAN Connectivity Card */}
            <RoyalCard className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#DED1BD] pb-3">
                <Globe size={18} className="text-[#B08401]" />
                <h3 className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] font-semibold">
                  Venue Local Network (LAN)
                </h3>
              </div>

              <p className="text-xs text-[#7A6658] leading-relaxed">
                Devices connected to the venue Wi-Fi or router can access live tournament standings and board assignments via this local address:
              </p>

              <div className="bg-[#FAF6F2] border border-[#DED1BD] rounded-[12px] p-3 font-mono text-xs text-[#683B2B] break-all select-all shadow-inner">
                {lanUrl}
              </div>

              <CopyButton
                text={lanUrl}
                label="Copy LAN URL"
                variant="secondary"
                size="md"
                successMessage="Venue LAN URL copied!"
              />

              <div className="text-[11px] font-cinzel text-[#7A6658] pt-2 border-t border-[#DED1BD]">
                Host IPv4: <span className="text-[#683B2B] font-semibold">{hostIp}</span>
              </div>
            </RoyalCard>

            {/* Quick Navigation Card */}
            <RoyalCard className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#DED1BD] pb-3">
                <Shield size={18} className="text-[#B08401]" />
                <h3 className="font-cinzel text-xs uppercase tracking-wider text-[#B08401] font-semibold">
                  Quick Navigation
                </h3>
              </div>
              <div className="space-y-1 font-cinzel text-xs">
                <Link
                  to="/"
                  className="flex items-center justify-between p-2.5 rounded-[10px] hover:bg-[#FAF6F2] text-[#7A6658] hover:text-[#683B2B] transition font-semibold"
                >
                  <span>Public Directory</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/participant"
                  className="flex items-center justify-between p-2.5 rounded-[10px] hover:bg-[#FAF6F2] text-[#7A6658] hover:text-[#683B2B] transition font-semibold"
                >
                  <span>Participant Dossier</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/arena"
                  className="flex items-center justify-between p-2.5 rounded-[10px] hover:bg-[#FAF6F2] text-[#7A6658] hover:text-[#683B2B] transition font-semibold"
                >
                  <span>Online Chess Arena</span>
                  <span>→</span>
                </Link>
              </div>
            </RoyalCard>
          </aside>
        </div>
      </main>

      <RoyalFooter />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Tournament"
          message="Are you sure you want to delete this championship record? All player rosters, rounds, and match history will be permanently expunged."
          confirmLabel="Delete Permanently"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  )
}
