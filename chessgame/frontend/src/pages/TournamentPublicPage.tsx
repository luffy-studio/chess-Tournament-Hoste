import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
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
import { Standing } from '../types'

type Tab = 'standings' | 'pairings' | 'rounds' | 'announcements'

export const TournamentPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { tournament, loading, socket } = useTournamentApi(id)
  const [activeTab, setActiveTab] = useState<Tab>('standings')
  const [openRound, setOpenRound] = useState<number | null>(null)
  const standingsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll standings to top when updated
  useEffect(() => {
    if (activeTab === 'standings' && standingsRef.current) {
      standingsRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [tournament?.participants, activeTab])

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col relative">
        <RoyalHeader />
        <main className="flex-1 flex items-center justify-center">
          <RoyalLoading message="Consulting championship broadsheet…" />
        </main>
        <RoyalFooter />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col relative">
        <RoyalHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <RoyalEmpty
            title="Championship Record Not Found"
            description="The requested tournament broadsheet could not be retrieved from the archives."
            actionLabel="Return to Championships"
            actionTo="/"
          />
        </main>
        <RoyalFooter />
      </div>
    )
  }

  const currentRoundMatches = tournament.matches?.filter(
    (m: any) => m.round === tournament.currentRound
  ) ?? []

  const allRounds: number[] = []
  ;(tournament.matches ?? []).forEach((m: any) => {
    if (!allRounds.includes(m.round)) allRounds.push(m.round)
  })
  allRounds.sort((a, b) => a - b)

  const announcements: any[] = tournament.announcements ?? []

  const getStandings = (): Standing[] => {
    return (tournament.standings ?? tournament.participants ?? [])
      .slice()
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .map((p: any, i: number) => ({ ...p, rank: i + 1 }))
  }

  const getPlayerName = (pId: string | null) => {
    if (!pId || pId === 'BYE') return 'BYE'
    return tournament.participants?.find((p: any) => p.id === pId)?.name ?? pId
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'standings', label: 'Live Standings' },
    { key: 'pairings', label: 'Current Pairings' },
    { key: 'rounds', label: 'All Rounds Archive' },
    { key: 'announcements', label: `Arbiter Notices (${announcements.length})` },
  ]

  const standings = getStandings()

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#241E19] font-sans flex flex-col relative selection:bg-[#B18A52]/25 selection:text-[#241E19]">
      <RoyalHeader />

      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8" ref={standingsRef}>
        {/* TOURNAMENT HERO BROADSIDE */}
        <RoyalCard className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E2D9CB] pb-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
                  Official Broadside
                </span>
                <span className="text-[#CEBEA8] text-xs">•</span>
                <ConnectionBadge socket={socket} />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#241E19] tracking-tight leading-[1.08] font-normal">
                {tournament.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <StatusBadge status={tournament.status} />
                <ModeBadge mode={tournament.mode} />
                {tournament.timeControl && (
                  <span className="font-cinzel text-xs text-[#786F66] border border-[#CEBEA8] px-2.5 py-0.5 rounded-full bg-[#FAF8F5]">
                    {tournament.timeControl}
                  </span>
                )}
                {tournament.venue && (
                  <span className="font-sans text-xs text-[#786F66]">
                    Venue: <strong className="text-[#241E19] font-medium">{tournament.venue}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <CopyButton
                text={typeof window !== 'undefined' ? window.location.href : ''}
                label="Share Championship"
                variant="secondary"
                size="md"
                successMessage="Tournament broadsheet URL copied"
              />
              <RoyalButton to="/participant" variant="secondary">
                My Matches
              </RoyalButton>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div>
              <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66]">
                Current Round
              </span>
              <p className="font-cinzel text-2xl font-bold text-[#241E19] mt-0.5">
                {tournament.currentRound} <span className="text-[#786F66] text-base font-normal">/ {tournament.roundsPlanned}</span>
              </p>
            </div>
            <div>
              <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66]">
                Enrolled Competitors
              </span>
              <p className="font-cinzel text-2xl font-bold text-[#241E19] mt-0.5">
                {tournament.participants?.length ?? 0}
              </p>
            </div>
            <div>
              <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66]">
                Pairing System
              </span>
              <p className="font-cinzel text-xs text-[#241E19] mt-1.5 font-semibold">
                {tournament.mode.toLowerCase().includes('swiss') ? 'FIDE Dutch Swiss' : 'Berger Round Robin'}
              </p>
            </div>
            <div>
              <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66]">
                Tiebreak Protocol
              </span>
              <p className="font-cinzel text-xs text-[#241E19] mt-1.5 font-semibold">
                Buchholz & Sonneborn-Berger
              </p>
            </div>
          </div>
        </RoyalCard>

        {/* CHAMPION PODIUM BANNER (RENDERED WHEN CONCLUDED) */}
        {tournament.status === 'completed' && tournament.winnerName && (
          <div className="rounded-[14px] border border-[#B18A52] bg-gradient-to-r from-[#FAF8F5] via-[#F4F0E8] to-[#FAF8F5] p-8 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full border border-[#B18A52]/40 bg-[#FAF8F5] p-1.5 mx-auto flex items-center justify-center shadow-xs">
              <img
                src="/grandmaster-emblem.png"
                alt="Champion Crest"
                className="h-full w-full object-contain filter drop-shadow-xs"
              />
            </div>
            <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#8C6B3E] font-semibold">
              Championship Grandmaster Victor
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#241E19] tracking-tight">
              {tournament.winnerName}
            </h2>
            <p className="text-xs sm:text-sm text-[#786F66] max-w-lg mx-auto">
              Championship officially ratified with verified FIDE tiebreak scores and archival match ledger.
            </p>
          </div>
        )}

        {/* NAVIGATION TAB CHIPS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E2D9CB] pb-4">
          {TABS.map((tab) => (
            <RoyalChip
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </RoyalChip>
          ))}
        </div>

        {/* TAB 1: LIVE STANDINGS */}
        {activeTab === 'standings' && (
          <div className="rounded-[14px] border border-[#E2D9CB] bg-[#FAF8F5] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E2D9CB] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B18A52] font-semibold">
                  Official Ledger
                </p>
                <h3 className="font-serif text-xl sm:text-2xl text-[#241E19] mt-0.5 tracking-tight">
                  Championship Standings
                </h3>
              </div>
              <span className="font-cinzel text-xs text-[#786F66]">
                {standings.length} Competitors Rated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2D9CB] bg-[#F4F0E8]/70">
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5 text-center w-16">
                      Rank
                    </th>
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5">
                      Player Name
                    </th>
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5 text-center">
                      Score
                    </th>
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5 text-center">
                      Rating
                    </th>
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5 text-center">
                      Buchholz
                    </th>
                    <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#786F66] px-5 py-3.5 text-center">
                      Sonneborn-Berger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D9CB]/70 text-sm">
                  {standings.map((s, i) => {
                    const isTopThree = i < 3
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-[#F6F2EC] ${
                          i === 0
                            ? 'bg-[#B18A52]/[0.06]'
                            : i === 1
                            ? 'bg-[#241E19]/[0.02]'
                            : i === 2
                            ? 'bg-[#B18A52]/[0.03]'
                            : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center font-cinzel text-sm ${
                              i === 0
                                ? 'text-[#8C6B3E] font-bold'
                                : i === 1
                                ? 'text-[#241E19] font-bold'
                                : i === 2
                                ? 'text-[#B18A52] font-semibold'
                                : 'text-[#786F66]'
                            }`}
                          >
                            {isTopThree ? (
                              <span className="w-7 h-7 rounded-full border border-[#CEBEA8] flex items-center justify-center bg-[#FAF8F5]">
                                {s.rank ?? i + 1}
                              </span>
                            ) : (
                              s.rank ?? i + 1
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {s.title && (
                              <span className="font-cinzel text-[10px] uppercase font-bold text-[#8C6B3E] border border-[#CEBEA8] px-1.5 py-0.5 rounded bg-[#FAF8F5]">
                                {s.title}
                              </span>
                            )}
                            <span className="font-medium text-[#241E19]">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-cinzel text-base font-bold text-[#241E19]">
                          {s.score ?? 0}
                        </td>
                        <td className="px-5 py-3.5 text-center font-cinzel text-xs text-[#786F66]">
                          {s.rating || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-cinzel text-xs text-[#786F66]">
                          {typeof s.buchholz === 'number' ? s.buchholz.toFixed(1) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-cinzel text-xs text-[#786F66]">
                          {typeof s.sonnebornBerger === 'number' ? s.sonnebornBerger.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[#786F66]">
                        No competitors currently registered in this championship ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CURRENT PAIRINGS */}
        {activeTab === 'pairings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CB] pb-4">
              <div>
                <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B18A52] font-semibold">
                  Round Fixtures
                </p>
                <h3 className="font-serif text-2xl text-[#241E19] tracking-tight">
                  Round {tournament.currentRound} Pairings
                </h3>
              </div>
              <span className="font-cinzel text-xs text-[#786F66]">
                {currentRoundMatches.filter((m: any) => m.result !== null).length} / {currentRoundMatches.length} boards completed
              </span>
            </div>

            {currentRoundMatches.length === 0 ? (
              <RoyalEmpty
                title="Pairings Pending"
                description={`Pairings for Round ${tournament.currentRound} have not yet been generated by the arbiter.`}
              />
            ) : (
              <div className="grid gap-4">
                {currentRoundMatches.map((m: any) => {
                  const isPending = m.result === null || m.result === undefined
                  const isBye = m.blackId === null
                  const white = tournament.participants?.find((p: any) => p.id === m.whiteId)
                  const black = tournament.participants?.find((p: any) => p.id === m.blackId)
                  const updatedTimeStr = m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'

                  return (
                    <RoyalCard key={m.id} className="space-y-4">
                      {/* Board Header Bar */}
                      <div className="flex items-center justify-between text-xs border-b border-[#E2D9CB] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-cinzel text-xs uppercase tracking-wider text-[#241E19] font-bold border border-[#CEBEA8] px-2.5 py-0.5 rounded-full bg-[#FAF8F5]">
                            Board {m.board}
                          </span>
                          <span className="text-[#786F66]">Round {m.round}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {isBye ? (
                            <span className="font-cinzel text-xs text-[#5B6E57] border border-[#5B6E57]/30 px-2.5 py-0.5 rounded-full bg-[#5B6E57]/10 font-semibold">
                              BYE (1.0 Pt)
                            </span>
                          ) : isPending ? (
                            <span className="font-cinzel text-xs text-[#8C6B3E] border border-[#B18A52]/30 px-2.5 py-0.5 rounded-full bg-[#B18A52]/10 font-semibold">
                              In Progress
                            </span>
                          ) : (
                            <span className="font-cinzel text-xs text-[#5B6E57] border border-[#5B6E57]/30 px-2.5 py-0.5 rounded-full bg-[#5B6E57]/10 font-semibold">
                              {m.result === 'W' ? '1 – 0 (White)' : m.result === 'L' ? '0 – 1 (Black)' : '½ – ½ (Draw)'}
                            </span>
                          )}
                          <span className="text-[#786F66] text-[11px] hidden sm:inline font-sans">
                            Synced {updatedTimeStr}
                          </span>
                        </div>
                      </div>

                      {/* Opponents & Center Score */}
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* White */}
                        <div className="p-3.5 rounded-[10px] bg-[#FAF8F5] border border-[#E2D9CB] text-left sm:text-right space-y-1">
                          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-[#786F66]">
                            <span className="text-base text-[#B18A52]">♔</span>
                            <span className="font-cinzel text-[10px] uppercase tracking-wider font-semibold">White Pieces</span>
                          </div>
                          <p className="font-serif font-medium text-base text-[#241E19] truncate">
                            {white?.name ?? 'BYE'}
                          </p>
                          <p className="font-cinzel text-[11px] text-[#786F66]">
                            Rating: {white?.rating || '—'}
                          </p>
                        </div>

                        {/* Result Display */}
                        <div className="flex items-center justify-center">
                          <div className="px-5 py-2 rounded-full border border-[#CEBEA8] bg-[#FAF8F5] font-cinzel text-sm text-[#241E19] font-bold shadow-xs">
                            {isBye ? (
                              '1 – 0'
                            ) : isPending ? (
                              <span className="text-[#8C6B3E]">VS</span>
                            ) : (
                              m.result === 'W' ? '1 – 0' : m.result === 'L' ? '0 – 1' : '½ – ½'
                            )}
                          </div>
                        </div>

                        {/* Black */}
                        <div className="p-3.5 rounded-[10px] bg-[#FAF8F5] border border-[#E2D9CB] text-left space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-[#786F66]">
                            <span className="text-base text-[#241E19]">♚</span>
                            <span className="font-cinzel text-[10px] uppercase tracking-wider font-semibold">Black Pieces</span>
                          </div>
                          <p className="font-serif font-medium text-base text-[#241E19] truncate">
                            {isBye ? 'BYE (Automatic Win)' : (black?.name ?? 'BYE')}
                          </p>
                          <p className="font-cinzel text-[11px] text-[#786F66]">
                            Rating: {isBye ? '—' : (black?.rating || '—')}
                          </p>
                        </div>
                      </div>
                    </RoyalCard>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL ROUNDS ARCHIVE */}
        {activeTab === 'rounds' && (
          <div className="space-y-4">
            {allRounds.length === 0 ? (
              <RoyalEmpty
                title="No Prior Rounds"
                description="Past rounds and fixtures will appear here once archived."
              />
            ) : (
              allRounds.map((round) => {
                const roundMatches = tournament.matches?.filter((m: any) => m.round === round) ?? []
                const isOpen = openRound === round
                return (
                  <RoyalCard key={round} className="p-0 overflow-hidden">
                    <button
                      onClick={() => setOpenRound(isOpen ? null : round)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F6F2EC] transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-cinzel text-xs text-[#241E19] font-bold border border-[#CEBEA8] px-2.5 py-0.5 rounded-full bg-[#FAF8F5]">
                          Round {round}
                        </span>
                        <h4 className="font-serif text-lg text-[#241E19]">
                          Completed Fixtures
                        </h4>
                      </div>
                      <span className="font-cinzel text-xs text-[#786F66]">
                        {roundMatches.length} Boards {isOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#E2D9CB] divide-y divide-[#E2D9CB]/70">
                        {roundMatches.map((m: any) => (
                          <div key={m.id} className="px-6 py-3.5 flex items-center gap-4 text-sm bg-[#FAF8F5]">
                            <span className="font-cinzel text-xs text-[#786F66] w-16 shrink-0">
                              Board {m.board}
                            </span>
                            <span className="flex-1 text-right font-medium text-[#241E19] truncate">
                              {getPlayerName(m.whiteId)}
                            </span>
                            <span className="font-cinzel text-xs font-bold text-[#241E19] px-3 py-1 rounded-full bg-[#F4F0E8] border border-[#CEBEA8] w-16 text-center shrink-0">
                              {m.result === null ? '—' : m.result === 'W' ? '1 – 0' : m.result === 'L' ? '0 – 1' : '½ – ½'}
                            </span>
                            <span className="flex-1 font-medium text-[#241E19] truncate">
                              {getPlayerName(m.blackId)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </RoyalCard>
                )
              })
            )}
          </div>
        )}

        {/* TAB 4: OFFICIAL ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <RoyalEmpty
                title="No Official Announcements"
                description="Arbiter notices and schedule decrees will be published here in real time."
              />
            ) : (
              announcements.map((a: any, i: number) => (
                <RoyalCard key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-[#E2D9CB] pb-2">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] font-semibold">
                      Notice #{i + 1}
                    </span>
                    {a.createdAt && (
                      <span className="text-[#786F66]">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-[#241E19] leading-relaxed font-sans">
                    {a.message ?? a.text ?? JSON.stringify(a)}
                  </p>
                </RoyalCard>
              ))
            )}
          </div>
        )}
      </main>

      <RoyalFooter />
    </div>
  )
}
