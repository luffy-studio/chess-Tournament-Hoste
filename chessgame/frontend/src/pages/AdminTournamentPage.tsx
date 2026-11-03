import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useTournamentApi } from '../utils/useTournamentApi'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalChip } from '../components/RoyalChip'
import { RoyalLoading } from '../components/RoyalLoading'
import { RoyalEmpty } from '../components/RoyalEmpty'
import { StatusBadge } from '../components/StatusBadge'
import { ModeBadge } from '../components/ModeBadge'
import { ConnectionBadge } from '../components/ConnectionBadge'
import { CopyButton } from '../components/CopyButton'
import { downloadCSV, rowsToCSV } from '../utils/csvUtils'
import toast from 'react-hot-toast'

type AdminTab = 'pairings' | 'participants' | 'standings' | 'audits' | 'announcements' | 'export'

export const AdminTournamentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tournament, loading, socket, refresh } = useTournamentApi(id)

  const [activeTab, setActiveTab] = useState<AdminTab>('pairings')
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerRating, setNewPlayerRating] = useState(1200)
  const [newPlayerTitle, setNewPlayerTitle] = useState('')
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [auditReport, setAuditReport] = useState<any>(null)
  const [auditLoading, setAuditLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('chess_admin_token')
    if (!token) {
      navigate('/admin')
    }
  }, [navigate])

  useEffect(() => {
    if (tournament?.currentRound) {
      setSelectedRound(tournament.currentRound)
    }
  }, [tournament?.currentRound])

  // Load audit report when tab changes to 'audits'
  useEffect(() => {
    if (activeTab === 'audits' && id && selectedRound) {
      fetchAuditReport(selectedRound)
    }
  }, [activeTab, id, selectedRound])

  const fetchAuditReport = async (roundNum: number) => {
    try {
      setAuditLoading(true)
      const res = await api.get(`/tournaments/${id}/audits/${roundNum}`)
      setAuditReport(res.data)
    } catch {
      setAuditReport(null)
    } finally {
      setAuditLoading(false)
    }
  }

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col">
        <RoyalHeader />
        <main className="flex-1 flex items-center justify-center">
          <RoyalLoading message="Loading arbiter console…" />
        </main>
        <RoyalFooter />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col">
        <RoyalHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <RoyalEmpty
            title="Tournament Not Found"
            description="The requested championship could not be located in the arbiter ledger."
            actionLabel="Return to Dashboard"
            actionTo="/admin/dashboard"
          />
        </main>
        <RoyalFooter />
      </div>
    )
  }

  const participants = tournament.participants ?? []
  const matches = tournament.matches ?? []
  const announcements = tournament.announcements ?? []

  const roundMatches = matches.filter((m: any) => m.round === selectedRound)

  // Round progression metrics
  const activeRoundMatches = matches.filter((m: any) => m.round === tournament.currentRound)
  const totalActive = activeRoundMatches.length
  const completedActive = activeRoundMatches.filter((m: any) => m.result !== null).length
  const pendingActive = totalActive - completedActive
  const isCurrentRoundFullyCompleted = totalActive > 0 && pendingActive === 0
  const isAllPlannedRoundsDone = tournament.currentRound >= tournament.roundsPlanned && isCurrentRoundFullyCompleted

  let roundStatusText = 'Round Not Started'
  let roundStatusBorder = 'border-[#CEBEA8] bg-[#FAF8F5]'

  if (tournament.status === 'completed') {
    roundStatusText = '🏆 Championship Finalized — Official Winner Ratified'
    roundStatusBorder = 'border-[#B18A52]/40 bg-[#B18A52]/10 text-[#B18A52]'
  } else if (tournament.status === 'setup') {
    roundStatusText = 'Institutional Setup Phase — Enroll participants and start'
    roundStatusBorder = 'border-[#CEBEA8] bg-[#FAF8F5]'
  } else if (isAllPlannedRoundsDone) {
    roundStatusText = `✅ All ${tournament.roundsPlanned} Planned Rounds Completed — Ready to Finalize`
    roundStatusBorder = 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
  } else if (isCurrentRoundFullyCompleted) {
    roundStatusText = `✅ Round ${tournament.currentRound} Completed — Ready for Round ${tournament.currentRound + 1}`
    roundStatusBorder = 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
  } else if (completedActive > 0) {
    roundStatusText = `⏳ Round ${tournament.currentRound} In Progress (${pendingActive} boards pending results)`
    roundStatusBorder = 'border-[#B18A52]/30 bg-[#F4F0E8] text-[#241E19]'
  } else {
    roundStatusText = `♟ Round ${tournament.currentRound} In Progress`
    roundStatusBorder = 'border-[#CEBEA8] bg-[#FAF8F5]'
  }

  // Available rounds
  const roundsList: number[] = []
  for (let r = 1; r <= (tournament.currentRound || 1); r++) {
    roundsList.push(r)
  }

  // Admin Actions
  const handleStartTournament = async () => {
    try {
      await api.post(`/tournaments/${id}/start`)
      toast.success('Championship launched! Round 1 pairings generated.')
      refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start tournament')
    }
  }

  const handleNextRound = async () => {
    try {
      await api.post(`/tournaments/${id}/next-round`)
      toast.success(`Round ${tournament.currentRound + 1} generated!`)
      refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate next round')
    }
  }

  const handleCompleteTournament = async () => {
    if (!window.confirm('Are you sure you want to officially complete and ratify this championship?')) return
    try {
      await api.patch(`/tournaments/${id}/complete`)
      toast.success('Tournament finalized and officially ratified!')
      refresh()
    } catch {
      toast.error('Failed to complete tournament')
    }
  }

  const handleUpdateResult = async (matchId: string, result: 'W' | 'L' | 'D' | null) => {
    try {
      await api.put(`/tournaments/${id}/matches/${matchId}`, { result })
      toast.success('Match result updated')
      refresh()
    } catch {
      toast.error('Failed to update result')
    }
  }

  const handleConfirmResult = async (matchId: string) => {
    try {
      await api.patch(`/tournaments/${id}/matches/${matchId}/confirm`)
      toast.success('Result officially confirmed and locked')
      refresh()
    } catch {
      toast.error('Failed to confirm result')
    }
  }

  const handleReopenRound = async (roundNum: number) => {
    if (!window.confirm(`Reopen Round ${roundNum}? All unconfirmed results will be reset.`)) return
    try {
      await api.post(`/tournaments/${id}/matches/${roundNum}/reopen`)
      toast.success(`Round ${roundNum} reopened`)
      refresh()
    } catch {
      toast.error('Failed to reopen round')
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    try {
      await api.post(`/tournaments/${id}/participants`, {
        name: newPlayerName.trim(),
        rating: Number(newPlayerRating) || 1200,
        title: newPlayerTitle.trim() || null,
      })
      toast.success(`Enrolled ${newPlayerName}`)
      setNewPlayerName('')
      setNewPlayerTitle('')
      refresh()
    } catch {
      toast.error('Failed to add participant')
    }
  }

  const handleRemoveParticipant = async (playerId: string, pName: string) => {
    if (!window.confirm(`Remove player ${pName}?`)) return
    try {
      await api.delete(`/tournaments/${id}/participants/${playerId}`)
      toast.success(`Removed ${pName}`)
      refresh()
    } catch {
      toast.error('Failed to remove participant')
    }
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementMsg.trim()) return
    try {
      await api.post(`/tournaments/${id}/announcements`, { message: announcementMsg })
      toast.success('Arbiter announcement broadcasted')
      setAnnouncementMsg('')
      refresh()
    } catch {
      toast.error('Failed to post announcement')
    }
  }

  // CSV Exports
  const exportStandings = () => {
    const header = ['Rank', 'Name', 'Rating', 'Title', 'Score', 'Buchholz', 'Sonneborn-Berger', 'Wins']
    const rows: (string | number)[][] = [header]
    participants
      .slice()
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .forEach((p: any, idx: number) => {
        rows.push([
          idx + 1,
          p.name,
          p.rating ?? 1200,
          p.title ?? '',
          p.score ?? 0,
          p.buchholz ?? 0,
          p.sonnebornBerger ?? 0,
          p.mostWins ?? 0,
        ])
      })
    downloadCSV(`${tournament.name}-standings.csv`, rowsToCSV(rows))
  }

  const exportResults = () => {
    const header = ['Round', 'Board', 'White', 'Black', 'Result', 'Status']
    const rows: (string | number)[][] = [header]
    matches.forEach((m: any) => {
      const whiteName = participants.find((p: any) => p.id === m.whiteId)?.name ?? 'BYE'
      const blackName = participants.find((p: any) => p.id === m.blackId)?.name ?? 'BYE'
      rows.push([
        m.round,
        m.board,
        whiteName,
        blackName,
        m.result ?? 'Pending',
        m.resultConfirmed ? 'Confirmed' : 'Unconfirmed',
      ])
    })
    downloadCSV(`${tournament.name}-results.csv`, rowsToCSV(rows))
  }

  const exportJsonBackup = async () => {
    try {
      const res = await api.get(`/tournaments/${id}/export`)
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `${tournament.name}-backup.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success('Backup snapshot downloaded')
    } catch {
      toast.error('Failed to export backup')
    }
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'pairings', label: 'Boards & Results' },
    { key: 'participants', label: `Participants (${participants.length})` },
    { key: 'standings', label: 'Standings Ledger' },
    { key: 'audits', label: 'FIDE Audit Checklist' },
    { key: 'announcements', label: `Notices (${announcements.length})` },
    { key: 'export', label: 'Export Reports' },
  ]

  return (
    <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col selection:bg-[#B18A52]/30 selection:text-[#F3EDE3]">
      <RoyalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Top Header Card */}
        <RoyalCard className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#514538] pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/admin/dashboard" className="font-cinzel text-xs text-[#B9AEA0] hover:text-[#F3EDE3] transition font-semibold">
                  ← Arbiter Console
                </Link>
                <span className="text-[#514538] text-xs">/</span>
                <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                  Championship Control
                </span>
                <span className="text-[#514538] text-xs">•</span>
                <ConnectionBadge socket={socket} />
              </div>
              <h1 className="font-serif italic font-normal text-3xl sm:text-4xl text-[#F3EDE3]">
                {tournament.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge status={tournament.status} />
                <ModeBadge mode={tournament.mode} />
                <span className="font-cinzel text-xs text-[#786F66] border border-[#CEBEA8] px-2.5 py-0.5 rounded-full bg-[#FAF8F5] font-semibold">
                  Round {tournament.currentRound} / {tournament.roundsPlanned}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CopyButton
                text={typeof window !== 'undefined' ? `${window.location.origin}/tournaments/${id}` : ''}
                label="Copy Public Link"
                variant="subtle"
                size="md"
                successMessage="Public link copied to clipboard!"
              />
              <RoyalButton to={`/tournaments/${id}`} variant="secondary">
                Public View ↗
              </RoyalButton>
            </div>
          </div>

          {/* Round Status Banner */}
          <div className={`p-4 rounded-[14px] border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${roundStatusBorder}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl text-[#B18A52]">♟</span>
              <div>
                <p className="font-cinzel text-xs uppercase tracking-wider font-bold">
                  {roundStatusText}
                </p>
                <p className="text-xs text-[#786F66] mt-0.5 font-sans">
                  {completedActive} of {totalActive} match results entered for Round {tournament.currentRound}
                </p>
              </div>
            </div>

            {isCurrentRoundFullyCompleted && !isAllPlannedRoundsDone && tournament.mode === 'swiss' && (
              <RoyalButton onClick={handleNextRound} variant="primary" className="text-xs py-2 px-4 shrink-0">
                Generate Round {tournament.currentRound + 1} Pairings →
              </RoyalButton>
            )}
          </div>
        </RoyalCard>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2D9CB] pb-4">
          {tabs.map((tab) => (
            <RoyalChip
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </RoyalChip>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Actions */}
          <aside className="space-y-5 lg:col-span-1">
            <RoyalCard className="space-y-4">
              <h3 className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold border-b border-[#E2D9CB] pb-2">
                Arbiter Controls
              </h3>

              {tournament.status === 'setup' && (
                <div className="space-y-2">
                  <RoyalButton
                    onClick={handleStartTournament}
                    disabled={participants.length < 2}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    ▶ Launch Championship
                  </RoyalButton>
                  {participants.length < 2 && (
                    <p className="text-[11px] font-cinzel text-[#9E3B3B] text-center font-semibold">
                      Minimum 2 participants required
                    </p>
                  )}
                </div>
              )}

              {tournament.status === 'ongoing' && tournament.mode === 'swiss' && !isAllPlannedRoundsDone && (
                <div className="space-y-2">
                  <RoyalButton
                    onClick={handleNextRound}
                    disabled={!isCurrentRoundFullyCompleted}
                    variant="primary"
                    className="w-full justify-center text-xs"
                  >
                    {isCurrentRoundFullyCompleted
                      ? `▶ Start Round ${tournament.currentRound + 1} →`
                      : `⏳ Next Round (${pendingActive} pending)`}
                  </RoyalButton>
                  {!isCurrentRoundFullyCompleted && (
                    <p className="text-[11px] text-[#786F66] text-center leading-relaxed font-sans">
                      Enter results for all {pendingActive} pending boards in Round {tournament.currentRound} to advance.
                    </p>
                  )}
                </div>
              )}

              {tournament.status === 'ongoing' && (
                <RoyalButton
                  onClick={handleCompleteTournament}
                  disabled={pendingActive > 0}
                  variant="secondary"
                  className="w-full justify-center text-xs"
                >
                  🏆 Finalize Championship
                </RoyalButton>
              )}

              <div className="pt-3 border-t border-[#E2D9CB] space-y-2 font-cinzel text-xs text-[#786F66]">
                <div className="flex justify-between">
                  <span>Current Round:</span>
                  <span className="text-[#241E19] font-bold">{tournament.currentRound} / {tournament.roundsPlanned}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participants:</span>
                  <span className="text-[#241E19] font-bold">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Fixtures:</span>
                  <span className="text-[#241E19] font-bold">{matches.length}</span>
                </div>
              </div>
            </RoyalCard>
          </aside>

          {/* Right Main Panel */}
          <section className="lg:col-span-3 space-y-6">
            {/* TAB 1: PAIRINGS & BOARD RESULTS */}
            {activeTab === 'pairings' && (
              <div className="space-y-4">
                {/* Round Switcher */}
                <RoyalCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] font-semibold">
                      Round:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roundsList.map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRound(r)}
                          className={`font-cinzel text-xs px-3.5 py-1 rounded-full transition-all font-semibold ${
                            selectedRound === r
                              ? 'bg-[#241E19] text-[#FAF8F5] shadow-sm'
                              : 'border border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66] hover:border-[#241E19]'
                          }`}
                        >
                          Round {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleReopenRound(selectedRound)}
                    className="font-cinzel text-xs text-[#9E3B3B] hover:underline font-semibold"
                  >
                    ↺ Reopen Round {selectedRound}
                  </button>
                </RoyalCard>

                {roundMatches.length === 0 ? (
                  <RoyalEmpty
                    title="No Fixtures Generated"
                    description={`No pairings exist yet for Round ${selectedRound}. Start the championship from the arbiter controls.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {roundMatches.map((m: any) => {
                      const white = participants.find((p: any) => p.id === m.whiteId)
                      const black = participants.find((p: any) => p.id === m.blackId)
                      const isBye = m.blackId === null
                      const isPending = m.result === null
                      const updatedTimeStr = m.updatedAt
                        ? new Date(m.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Pending'

                      return (
                        <RoyalCard key={m.id} className="space-y-4">
                          {/* Board Header Bar */}
                          <div className="flex items-center justify-between text-xs border-b border-[#E2D9CB] pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] border border-[#B18A52]/30 px-2.5 py-0.5 rounded-full bg-[#F4F0E8] font-bold">
                                Board {m.board}
                              </span>
                              <span className="text-[#786F66] font-cinzel">Round {m.round}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {isBye ? (
                                <span className="font-cinzel text-xs text-[#5B6E57] border border-[#5B6E57]/30 px-2.5 py-0.5 rounded-full bg-[#5B6E57]/10 font-bold">
                                  BYE (1.0 Pt)
                                </span>
                              ) : isPending ? (
                                <span className="font-cinzel text-xs text-[#B18A52] border border-[#B18A52]/30 px-2.5 py-0.5 rounded-full bg-[#B18A52]/10 font-bold">
                                  In Progress
                                </span>
                              ) : (
                                <span className="font-cinzel text-xs text-[#5B6E57] border border-[#5B6E57]/30 px-2.5 py-0.5 rounded-full bg-[#5B6E57]/10 font-bold">
                                  Result: {m.result === 'W' ? '1 – 0' : m.result === 'L' ? '0 – 1' : '½ – ½'}
                                </span>
                              )}
                              <span className="font-cinzel text-[11px] text-[#786F66] hidden sm:inline">
                                Updated: {updatedTimeStr}
                              </span>
                            </div>
                          </div>

                          {/* Players & Quick Score Buttons */}
                          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 w-full">
                              {/* White */}
                              <div className="text-right flex-1 min-w-[120px] p-3 rounded-[12px] bg-[#F4F0E8] border border-[#CEBEA8]">
                                <span className="font-cinzel text-[10px] uppercase text-[#786F66] block font-semibold">
                                  ♔ White
                                </span>
                                <p className="font-serif font-medium text-sm text-[#241E19] truncate">
                                  {white?.name ?? 'BYE'}
                                </p>
                                <p className="font-cinzel text-[10px] text-[#786F66] mt-0.5">
                                  Rating: {white?.rating ?? '—'}
                                </p>
                              </div>

                              <span className="font-cinzel text-xs text-[#B18A52] font-bold">VS</span>

                              {/* Black */}
                              <div className="text-left flex-1 min-w-[120px] p-3 rounded-[12px] bg-[#F4F0E8] border border-[#CEBEA8]">
                                <span className="font-cinzel text-[10px] uppercase text-[#786F66] block font-semibold">
                                  ♚ Black
                                </span>
                                <p className="font-serif font-medium text-sm text-[#241E19] truncate">
                                  {isBye ? 'BYE (Automatic Win)' : (black?.name ?? 'BYE')}
                                </p>
                                <p className="font-cinzel text-[10px] text-[#786F66] mt-0.5">
                                  Rating: {isBye ? '—' : (black?.rating ?? '—')}
                                </p>
                              </div>
                            </div>

                            {/* Result Buttons */}
                            <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                              {isBye ? (
                                <span className="font-cinzel text-xs text-[#5B6E57] border border-[#5B6E57]/30 px-3 py-1 rounded-full bg-[#5B6E57]/10 font-bold">
                                  ✓ Automatic Point Awarded
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleUpdateResult(m.id, 'W')}
                                    className={`font-cinzel text-xs px-3.5 py-1.5 rounded-full transition-all font-bold ${
                                      m.result === 'W'
                                        ? 'bg-[#241E19] text-[#FAF8F5] shadow-sm'
                                        : 'border border-[#CEBEA8] bg-[#FAF8F5] text-[#241E19] hover:border-[#241E19]'
                                    }`}
                                  >
                                    1 – 0
                                  </button>
                                  <button
                                    onClick={() => handleUpdateResult(m.id, 'D')}
                                    className={`font-cinzel text-xs px-3.5 py-1.5 rounded-full transition-all font-bold ${
                                      m.result === 'D'
                                        ? 'bg-[#241E19] text-[#FAF8F5] shadow-sm'
                                        : 'border border-[#CEBEA8] bg-[#FAF8F5] text-[#241E19] hover:border-[#241E19]'
                                    }`}
                                  >
                                    ½ – ½
                                  </button>
                                  <button
                                    onClick={() => handleUpdateResult(m.id, 'L')}
                                    className={`font-cinzel text-xs px-3.5 py-1.5 rounded-full transition-all font-bold ${
                                      m.result === 'L'
                                        ? 'bg-[#241E19] text-[#FAF8F5] shadow-sm'
                                        : 'border border-[#CEBEA8] bg-[#FAF8F5] text-[#241E19] hover:border-[#241E19]'
                                    }`}
                                  >
                                    0 – 1
                                  </button>
                                  {m.result && (
                                    <button
                                      onClick={() => handleUpdateResult(m.id, null)}
                                      title="Reset Match Result"
                                      className="font-cinzel text-xs px-2.5 py-1 rounded-full border border-[#9E3B3B]/40 text-[#9E3B3B] hover:bg-[#9E3B3B]/10 transition font-bold"
                                    >
                                      ✕
                                    </button>
                                  )}
                                  {m.result && !m.resultConfirmed && (
                                    <button
                                      onClick={() => handleConfirmResult(m.id)}
                                      title="Officially Confirm Result"
                                      className="font-cinzel text-xs px-3 py-1 rounded-full border border-[#5B6E57]/40 text-[#5B6E57] hover:bg-[#5B6E57]/10 transition font-bold"
                                    >
                                      ✓ Confirm
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </RoyalCard>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {activeTab === 'participants' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleAddParticipant}
                  className="rounded-[18px] border border-[#CEBEA8] bg-[#FAF8F5] p-5 flex flex-wrap gap-4 items-end shadow-sm"
                >
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                      Player Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Grandmaster Name"
                      className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-2 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] transition font-sans shadow-inner"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                      Rating
                    </label>
                    <input
                      type="number"
                      value={newPlayerRating}
                      onChange={(e) => setNewPlayerRating(parseInt(e.target.value, 10) || 1200)}
                      className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-2 text-sm text-[#241E19] font-cinzel focus:outline-none focus:border-[#B18A52] transition shadow-inner"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="GM, IM"
                      value={newPlayerTitle}
                      onChange={(e) => setNewPlayerTitle(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-3.5 py-2 text-sm text-[#241E19] font-cinzel focus:outline-none focus:border-[#B18A52] transition shadow-inner"
                    />
                  </div>
                  <RoyalButton type="submit" variant="primary">
                    + Add Player
                  </RoyalButton>
                </form>

                <RoyalCard className="overflow-hidden p-0 sm:p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2D9CB] bg-[#F4F0E8]">
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 w-16 font-semibold">#</th>
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 font-semibold">Name</th>
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 font-semibold">Title</th>
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 font-semibold">Rating</th>
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 font-semibold">Score</th>
                        <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2D9CB] text-sm">
                      {participants.map((p: any, idx: number) => (
                        <tr key={p.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                          <td className="font-cinzel text-xs text-[#786F66] px-5 py-3 font-semibold">{idx + 1}</td>
                          <td className="font-medium text-[#241E19] px-5 py-3">{p.name}</td>
                          <td className="font-cinzel text-xs text-[#B18A52] font-bold px-5 py-3">{p.title || '—'}</td>
                          <td className="font-cinzel text-xs text-[#786F66] px-5 py-3 font-semibold">{p.rating}</td>
                          <td className="font-cinzel text-sm font-bold text-[#241E19] px-5 py-3">{p.score}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleRemoveParticipant(p.id, p.name)}
                              className="font-cinzel text-xs text-[#9E3B3B] hover:underline font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </RoyalCard>
              </div>
            )}

            {/* TAB 3: STANDINGS */}
            {activeTab === 'standings' && (
              <RoyalCard className="overflow-hidden p-0 sm:p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2D9CB] bg-[#F4F0E8]">
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 w-16 text-center font-semibold">Rank</th>
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 font-semibold">Player</th>
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 text-center font-semibold">Score</th>
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 text-center font-semibold">Buchholz</th>
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 text-center font-semibold">SB</th>
                      <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3 text-center font-semibold">Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9CB] text-sm">
                    {participants
                      .slice()
                      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
                      .map((p: any, idx: number) => (
                        <tr key={p.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                          <td className="font-cinzel text-xs font-bold text-[#B18A52] px-5 py-3 text-center">#{idx + 1}</td>
                          <td className="font-medium text-[#241E19] px-5 py-3">
                            {p.title && <span className="font-cinzel text-[10px] text-[#B18A52] mr-1.5 font-bold">{p.title}</span>}
                            {p.name}
                          </td>
                          <td className="font-cinzel text-base font-bold text-[#241E19] px-5 py-3 text-center">{p.score}</td>
                          <td className="font-cinzel text-xs text-[#786F66] px-5 py-3 text-center font-semibold">{typeof p.buchholz === 'number' ? p.buchholz.toFixed(1) : '—'}</td>
                          <td className="font-cinzel text-xs text-[#786F66] px-5 py-3 text-center font-semibold">{typeof p.sonnebornBerger === 'number' ? p.sonnebornBerger.toFixed(2) : '—'}</td>
                          <td className="font-cinzel text-xs text-[#786F66] px-5 py-3 text-center font-semibold">{p.mostWins ?? 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </RoyalCard>
            )}

            {/* TAB 4: FIDE AUDIT LOG */}
            {activeTab === 'audits' && (
              <RoyalCard className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2D9CB] pb-4">
                  <div>
                    <p className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      FIDE Dutch Standard Verification
                    </p>
                    <h3 className="font-serif italic text-2xl text-[#241E19] mt-0.5">
                      Round {selectedRound} Audit Report
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {roundsList.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setSelectedRound(r)
                          fetchAuditReport(r)
                        }}
                        className={`font-cinzel text-xs px-3 py-1 rounded-full transition-all font-semibold ${
                          selectedRound === r
                            ? 'bg-[#241E19] text-[#FAF8F5]'
                            : 'border border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
                        }`}
                      >
                        Round {r}
                      </button>
                    ))}
                  </div>
                </div>

                {auditLoading ? (
                  <RoyalLoading message="Compiling FIDE compliance report…" />
                ) : auditReport ? (
                  <div className="space-y-5">
                    {/* Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {auditReport.fideComplianceReport?.checklist?.map((item: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-[12px] bg-[#F4F0E8] border border-[#CEBEA8] flex items-start gap-3 shadow-sm">
                          <span className={`font-cinzel text-base font-bold ${item.status === 'PASS' ? 'text-[#5B6E57]' : 'text-[#B18A52]'}`}>
                            {item.status === 'PASS' ? '✓' : '⚠'}
                          </span>
                          <div>
                            <p className="font-serif font-semibold text-sm text-[#241E19]">{item.rule}</p>
                            <p className="text-xs text-[#786F66] mt-0.5 font-sans">{item.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Floater report */}
                    {auditReport.pairingAuditReport?.floaters?.length > 0 && (
                      <div className="p-4 rounded-[14px] bg-[#F4F0E8] border border-[#CEBEA8] space-y-2 shadow-sm">
                        <p className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                          Score Group Floaters:
                        </p>
                        <div className="space-y-1.5">
                          {auditReport.pairingAuditReport.floaters.map((f: any, idx: number) => {
                            const player = participants.find((p: any) => p.id === f.playerId)
                            const displayName = f.playerName || player?.name || `Player (${f.playerId.slice(0, 8)})`
                            const isUp = f.direction === 'up'

                            return (
                              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E2D9CB] last:border-none">
                                <span className="font-serif font-medium text-[#241E19]">{displayName}</span>
                                <span
                                  className={`font-cinzel text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${
                                    isUp
                                      ? 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
                                      : 'border-[#B18A52]/40 bg-[#B18A52]/10 text-[#B18A52]'
                                  }`}
                                >
                                  Floated {f.direction} ({f.fromScore} → {f.toScore})
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#786F66] text-xs font-cinzel text-center py-6">
                    No pairing audit log generated yet for Round {selectedRound}.
                  </p>
                )}
              </RoyalCard>
            )}

            {/* TAB 5: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <form onSubmit={handlePostAnnouncement} className="rounded-[18px] border border-[#CEBEA8] bg-[#FAF8F5] p-5 space-y-3 shadow-sm">
                  <label className="font-cinzel text-xs uppercase tracking-wider text-[#786F66] block font-semibold">
                    Broadcast Championship Announcement
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      placeholder="e.g. Round 3 starting in 10 minutes on all boards"
                      className="flex-1 bg-[#FAF8F5] border border-[#CEBEA8] rounded-[12px] px-4 py-2 text-sm text-[#241E19] placeholder-[#786F66] focus:outline-none focus:border-[#B18A52] transition font-sans shadow-inner"
                    />
                    <RoyalButton type="submit" variant="primary">
                      Broadcast
                    </RoyalButton>
                  </div>
                </form>

                <div className="space-y-2">
                  {announcements.map((a: any) => (
                    <RoyalCard key={a.id} className="p-4 space-y-1">
                      <p className="text-sm text-[#241E19]">{a.message}</p>
                      <p className="font-cinzel text-[10px] text-[#786F66]">
                        Posted by {a.postedBy} • {new Date(a.createdAt).toLocaleTimeString()}
                      </p>
                    </RoyalCard>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: EXPORT & REPORTS */}
            {activeTab === 'export' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RoyalCard className="flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      Ledger Archive
                    </span>
                    <h4 className="font-serif italic text-lg text-[#241E19]">Standings Report</h4>
                    <p className="text-xs text-[#786F66]">Export official standings with all computed tie-breaks.</p>
                  </div>
                  <RoyalButton onClick={exportStandings} variant="secondary">
                    Download Standings CSV
                  </RoyalButton>
                </RoyalCard>

                <RoyalCard className="flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      Round History
                    </span>
                    <h4 className="font-serif italic text-lg text-[#241E19]">Match Results</h4>
                    <p className="text-xs text-[#786F66]">Export full tournament match history board by board.</p>
                  </div>
                  <RoyalButton onClick={exportResults} variant="secondary">
                    Download Results CSV
                  </RoyalButton>
                </RoyalCard>

                <RoyalCard className="flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      Institutional Backup
                    </span>
                    <h4 className="font-serif italic text-lg text-[#241E19]">Full JSON Backup</h4>
                    <p className="text-xs text-[#786F66]">Complete snapshot for offline disaster recovery.</p>
                  </div>
                  <RoyalButton onClick={exportJsonBackup} variant="secondary">
                    Download JSON Backup
                  </RoyalButton>
                </RoyalCard>

                <RoyalCard className="flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      Public Propagation
                    </span>
                    <h4 className="font-serif italic text-lg text-[#241E19]">Live Share Link</h4>
                    <p className="text-xs text-[#786F66]">Public scoreboard link for spectators and players.</p>
                  </div>
                  <CopyButton
                    text={typeof window !== 'undefined' ? `${window.location.origin}/tournaments/${id}` : ''}
                    label="Copy Public Link"
                    variant="subtle"
                    size="md"
                    className="w-full justify-center"
                    successMessage="Tournament link copied to clipboard!"
                  />
                </RoyalCard>
              </div>
            )}
          </section>
        </div>
      </main>

      <RoyalFooter />
    </div>
  )
}
