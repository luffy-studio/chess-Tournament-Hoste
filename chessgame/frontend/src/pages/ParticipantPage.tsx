import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import { useTournamentApi } from '../utils/useTournamentApi'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalLoading } from '../components/RoyalLoading'
import { RoyalEmpty } from '../components/RoyalEmpty'
import { ConnectionBadge } from '../components/ConnectionBadge'
import { CopyButton } from '../components/CopyButton'

export const ParticipantPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tournamentIdParam = searchParams.get('tournament')
  const playerNameParam = searchParams.get('name') || ''

  const [tournaments, setTournaments] = useState<any[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentIdParam || '')
  const [playerName, setPlayerName] = useState<string>(playerNameParam)
  const [searchQuery, setSearchQuery] = useState<string>(playerNameParam)

  const { tournament, loading, socket } = useTournamentApi(selectedTournamentId || undefined)

  useEffect(() => {
    api
      .get('/tournaments')
      .then((res) => {
        setTournaments(res.data)
        if (!selectedTournamentId && res.data.length > 0) {
          setSelectedTournamentId(res.data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const handleSelectTournament = (id: string) => {
    setSelectedTournamentId(id)
    setSearchParams({ tournament: id, name: playerName })
  }

  const handleSearchPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    setPlayerName(searchQuery.trim())
    setSearchParams({ tournament: selectedTournamentId, name: searchQuery.trim() })
  }

  const participants = tournament?.participants ?? []
  const matchedParticipant = participants.find(
    (p: any) => p.name.toLowerCase() === playerName.toLowerCase()
  )

  const currentMatches = tournament?.matches?.filter((m: any) => m.round === tournament.currentRound) ?? []
  const currentMatch = matchedParticipant
    ? currentMatches.find(
        (m: any) => m.whiteId === matchedParticipant.id || m.blackId === matchedParticipant.id
      )
    : null

  const playerMatches = matchedParticipant
    ? (tournament?.matches ?? [])
        .filter((m: any) => m.whiteId === matchedParticipant.id || m.blackId === matchedParticipant.id)
        .sort((a: any, b: any) => a.round - b.round)
    : []

  const announcements = tournament?.announcements ?? []

  return (
    <div className="min-h-screen bg-[#24211E] text-[#F3EDE3] font-sans flex flex-col selection:bg-[#B18A52]/30 selection:text-[#F3EDE3]">
      <RoyalHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Header & Page Title */}
        <div className="space-y-2 border-b border-[#514538] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52] font-semibold">
                Personal Competitor Dossier
              </p>
              <h1 className="font-serif italic font-normal text-3xl sm:text-4xl lg:text-5xl text-[#F3EDE3] mt-1 tracking-tight">
                Participant <span className="text-[#B18A52]">Portal</span>
              </h1>
            </div>
            {socket && <ConnectionBadge socket={socket} />}
          </div>
        </div>

        {/* Tournament & Player Selector Card */}
        <RoyalCard className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                Select Championship Ledger
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => handleSelectTournament(e.target.value)}
                className="w-full bg-[#302A25] border border-[#514538] rounded-[12px] px-3.5 py-2.5 text-xs text-[#F3EDE3] font-cinzel focus:outline-none focus:border-[#B18A52] transition shadow-inner"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSearchPlayer} className="space-y-2">
              <label className="font-cinzel text-xs uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                Locate Competitor by Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Magnus Carlsen"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#302A25] border border-[#514538] rounded-[12px] px-3.5 py-2 text-sm text-[#F3EDE3] placeholder-[#B9AEA0]/50 focus:outline-none focus:border-[#B18A52] transition font-sans shadow-inner"
                />
                <RoyalButton type="submit" variant="primary">
                  Find
                </RoyalButton>
              </div>
            </form>
          </div>
        </RoyalCard>

        {loading && <RoyalLoading message="Consulting tournament ledger…" />}

        {/* Player Found Overview Card */}
        {matchedParticipant && tournament && (
          <RoyalCard className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#514538] pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#24211E] border border-[#514538] p-2 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/grandmaster-emblem.png"
                    alt="Grandmaster Suite Emblem"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif italic font-normal text-3xl text-[#F3EDE3]">
                      {matchedParticipant.name}
                    </h2>
                    {matchedParticipant.title && (
                      <span className="font-cinzel text-xs uppercase font-bold text-[#24211E] bg-[#B18A52] px-2.5 py-0.5 rounded-full shadow-sm">
                        {matchedParticipant.title}
                      </span>
                    )}
                  </div>
                  <p className="font-cinzel text-xs text-[#B9AEA0]">
                    FIDE Rating: <span className="text-[#F3EDE3] font-bold">{matchedParticipant.rating ?? 1200}</span> • Championship: <span className="text-[#F3EDE3] font-medium">{tournament.name}</span>
                  </p>
                </div>
              </div>

              {/* Stats badges & Share */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="rounded-[14px] bg-[#302A25] border border-[#514538] px-4 py-2.5 text-center min-w-[80px] shadow-sm">
                  <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    Score
                  </span>
                  <span className="font-cinzel text-2xl font-bold text-[#B18A52]">
                    {matchedParticipant.score ?? 0}
                  </span>
                </div>
                <div className="rounded-[14px] bg-[#302A25] border border-[#514538] px-4 py-2.5 text-center min-w-[80px] shadow-sm">
                  <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#B9AEA0] block font-semibold">
                    Buchholz
                  </span>
                  <span className="font-cinzel text-2xl font-bold text-[#F3EDE3]">
                    {typeof matchedParticipant.buchholz === 'number' ? matchedParticipant.buchholz.toFixed(1) : 0}
                  </span>
                </div>
                <CopyButton
                  text={typeof window !== 'undefined' ? window.location.href : ''}
                  label="Share Dossier"
                  variant="subtle"
                  size="md"
                  successMessage="Player link copied to clipboard!"
                />
              </div>
            </div>

            {/* Active Round Board Assignment */}
            {currentMatch ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52] border border-[#B18A52]/40 px-3 py-1 rounded-full bg-[#302A25] font-semibold">
                      Round {tournament.currentRound} Fixture
                    </span>
                  </div>
                  <span className="font-cinzel text-xs text-[#B9AEA0]">
                    Status: {currentMatch.result ? 'Completed' : 'Awaiting Arbitration'}
                  </span>
                </div>

                <div className="rounded-[16px] bg-[#24211E] border border-[#514538] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  {/* Board Number */}
                  <div className="flex flex-col items-center">
                    <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#B9AEA0] font-semibold">
                      Board
                    </span>
                    <span className="font-cinzel text-4xl font-bold text-[#F3EDE3] mt-0.5">
                      #{currentMatch.board}
                    </span>
                    <span className="font-cinzel text-[10px] text-[#B9AEA0] mt-1">
                      Round {currentMatch.round}
                    </span>
                  </div>

                  {/* VS Display */}
                  <div className="flex items-center gap-4 flex-1 justify-center w-full">
                    {/* White */}
                    <div
                      className={`text-center p-3.5 rounded-[12px] border flex-1 max-w-[200px] transition-all ${
                        currentMatch.whiteId === matchedParticipant.id
                          ? 'border-[#B18A52] bg-[#FAF8F5] ring-1 ring-[#B18A52] shadow-sm'
                          : 'border-[#E2D9CB] bg-[#FAF8F5]'
                      }`}
                    >
                      <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#786F66] block mb-1 font-semibold">
                        ♔ White Pieces
                      </span>
                      <p className="font-serif font-medium text-sm text-[#241E19] truncate">
                        {participants.find((p: any) => p.id === currentMatch.whiteId)?.name ?? 'BYE'}
                      </p>
                      <p className="font-cinzel text-[10px] text-[#786F66] mt-0.5">
                        ID: {currentMatch.whiteId ? currentMatch.whiteId.slice(0, 8) : '—'}
                      </p>
                    </div>

                    <span className="font-cinzel text-sm text-[#B18A52] font-bold">VS</span>

                    {/* Black */}
                    <div
                      className={`text-center p-3.5 rounded-[12px] border flex-1 max-w-[200px] transition-all ${
                        currentMatch.blackId === matchedParticipant.id
                          ? 'border-[#B18A52] bg-[#FAF8F5] ring-1 ring-[#B18A52] shadow-sm'
                          : 'border-[#E2D9CB] bg-[#FAF8F5]'
                      }`}
                    >
                      <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#786F66] block mb-1 font-semibold">
                        ♚ Black Pieces
                      </span>
                      <p className="font-serif font-medium text-sm text-[#241E19] truncate">
                        {currentMatch.blackId === null
                          ? 'BYE (Automatic Win)'
                          : participants.find((p: any) => p.id === currentMatch.blackId)?.name ?? 'BYE'}
                      </p>
                      <p className="font-cinzel text-[10px] text-[#786F66] mt-0.5">
                        ID: {currentMatch.blackId ? currentMatch.blackId.slice(0, 8) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Result & Time */}
                  <div className="text-center">
                    <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#786F66] block mb-1 font-semibold">
                      Result
                    </span>
                    <span
                      className={`font-cinzel text-xs px-3.5 py-1.5 rounded-full block border font-bold ${
                        currentMatch.result
                          ? 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
                          : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
                      }`}
                    >
                      {currentMatch.result === 'W'
                        ? '1 – 0 (White)'
                        : currentMatch.result === 'L'
                        ? '0 – 1 (Black)'
                        : currentMatch.result === 'D'
                        ? '½ – ½'
                        : 'In Progress'}
                    </span>
                    <span className="font-cinzel text-[10px] text-[#786F66] mt-1.5 block">
                      {currentMatch.updatedAt
                        ? new Date(currentMatch.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#786F66] text-center py-4 font-cinzel">
                No active pairing assigned for this player in Round {tournament.currentRound}.
              </p>
            )}

            {/* Personal Match History */}
            {playerMatches.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#E2D9CB]">
                <h3 className="font-serif italic text-xl text-[#241E19]">
                  Personal Match Ledger
                </h3>
                <div className="divide-y divide-[#E2D9CB] rounded-[14px] bg-[#FAF8F5] border border-[#E2D9CB] overflow-hidden">
                  {playerMatches.map((m: any) => {
                    const isWhite = m.whiteId === matchedParticipant.id
                    const oppId = isWhite ? m.blackId : m.whiteId
                    const opponent = participants.find((p: any) => p.id === oppId)
                    let outcome = 'Pending'
                    if (m.result) {
                      if (m.result === 'D') outcome = 'Draw (0.5)'
                      else if ((m.result === 'W' && isWhite) || (m.result === 'L' && !isWhite)) outcome = 'Win (1.0)'
                      else outcome = 'Loss (0.0)'
                    }

                    return (
                      <div key={m.id} className="px-4 py-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-cinzel text-xs text-[#B18A52] font-bold">
                            R{m.round}
                          </span>
                          <span className="font-cinzel text-[11px] text-[#786F66]">
                            Board {m.board}
                          </span>
                          <span className="font-serif text-[#241E19] font-medium">
                            vs {opponent ? opponent.name : 'BYE'} ({isWhite ? 'White' : 'Black'})
                          </span>
                        </div>
                        <span
                          className={`font-cinzel text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                            outcome.includes('Win')
                              ? 'border-[#5B6E57]/40 bg-[#5B6E57]/10 text-[#5B6E57]'
                              : outcome.includes('Loss')
                              ? 'border-[#9E3B3B]/40 bg-[#9E3B3B]/10 text-[#9E3B3B]'
                              : 'border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66]'
                          }`}
                        >
                          {outcome}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </RoyalCard>
        )}

        {/* Tournament Announcements */}
        {announcements.length > 0 && (
          <RoyalCard className="space-y-3">
            <h3 className="font-serif italic text-xl text-[#241E19]">
              Official Championship Notices
            </h3>
            <div className="space-y-2">
              {announcements.map((a: any) => (
                <div key={a.id} className="p-3.5 rounded-[12px] bg-[#FAF8F5] border border-[#CEBEA8] text-sm space-y-1">
                  <p className="text-[#241E19]">{a.message}</p>
                  <span className="font-cinzel text-[10px] text-[#786F66] block">
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </RoyalCard>
        )}

        {/* Empty State when no match */}
        {!matchedParticipant && playerName && (
          <RoyalEmpty
            title="Player Not Found"
            description={`No participant named "${playerName}" was found registered in this championship ledger. Verify spelling or choose another tournament above.`}
          />
        )}
      </main>

      <RoyalFooter />
    </div>
  )
}
