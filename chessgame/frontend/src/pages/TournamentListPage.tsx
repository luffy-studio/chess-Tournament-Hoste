import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { Tournament } from '../types'
import { RoyalHeader } from '../components/RoyalHeader'
import { RoyalFooter } from '../components/RoyalFooter'
import { RoyalButton } from '../components/RoyalButton'
import { RoyalCard } from '../components/RoyalCard'
import { RoyalChip } from '../components/RoyalChip'
import { RoyalLoading } from '../components/RoyalLoading'
import { RoyalEmpty } from '../components/RoyalEmpty'
import { StatusBadge } from '../components/StatusBadge'
import { ModeBadge } from '../components/ModeBadge'
import { Swords, Trophy, Users, ShieldCheck, ArrowRight } from 'lucide-react'

export const TournamentListPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [filterMode, setFilterMode] = useState<string>('all')

  useEffect(() => {
    api
      .get('/tournaments')
      .then((res) => {
        setTournaments(res.data)
        setOffline(false)
      })
      .catch(() => {
        setOffline(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredTournaments = useMemo(() => {
    if (filterMode === 'all') return tournaments
    if (filterMode === 'swiss') return tournaments.filter(t => t.mode.toLowerCase() === 'swiss')
    if (filterMode === 'round_robin') return tournaments.filter(t => t.mode.toLowerCase().includes('round'))
    if (filterMode === 'active') return tournaments.filter(t => t.status === 'ongoing' || (t.status as string) === 'ACTIVE')
    if (filterMode === 'completed') return tournaments.filter(t => t.status === 'completed' || (t.status as string) === 'COMPLETED')
    return tournaments
  }, [tournaments, filterMode])

  const stats = useMemo(() => {
    const totalTournaments = tournaments.length
    const totalPlayers = tournaments.reduce((acc, t) => acc + (t.participants?.length || 0), 0)
    const activeTournaments = tournaments.filter(t => t.status === 'ongoing' || (t.status as string) === 'ACTIVE').length
    return { totalTournaments, totalPlayers, activeTournaments }
  }, [tournaments])

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#683B2B] font-sans flex flex-col relative selection:bg-[#B08401]/25 selection:text-[#683B2B]">
      <RoyalHeader />

      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
        
        {/* EDITORIAL HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#DED1BD] bg-[#FFFFFF] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B08401]" />
            <span className="font-cinzel text-[11px] uppercase tracking-[0.22em] text-[#7A6658] font-semibold">
              Tournament Ledger
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#683B2B] tracking-tight leading-[1.08] font-normal">
            The Official Realm of <span className="italic text-[#B08401]">Championship Chess</span>
          </h1>

          <p className="text-[#7A6658] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans font-normal">
            Host, manage, and arbitrate competitive chess tournaments with mathematical pairing precision, official tiebreak algorithms, and real-time live boards.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <RoyalButton to="/admin/tournaments/new" variant="primary">
              Inaugurate Tournament
            </RoyalButton>
            <RoyalButton to="/arena" variant="secondary">
              Enter Live Arena
            </RoyalButton>
          </div>
        </section>

        {/* INSTITUTIONAL METRICS ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#FFFFFF] border border-[#DED1BD] rounded-[14px] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#7A6658]">
              <span className="font-cinzel text-xs uppercase tracking-[0.2em] font-semibold">
                Active Arbitration
              </span>
              <Trophy size={16} className="text-[#B08401]" />
            </div>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#683B2B] font-bold mt-4">
              {stats.activeTournaments}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">Fixtures under live round arbitration</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#DED1BD] rounded-[14px] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#7A6658]">
              <span className="font-cinzel text-xs uppercase tracking-[0.2em] font-semibold">
                Enrolled Competitors
              </span>
              <Users size={16} className="text-[#B08401]" />
            </div>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#683B2B] font-bold mt-4">
              {stats.totalPlayers}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">Active rated participants across divisions</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#DED1BD] rounded-[14px] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#7A6658]">
              <span className="font-cinzel text-xs uppercase tracking-[0.2em] font-semibold">
                Sanctioned Ledger
              </span>
              <ShieldCheck size={16} className="text-[#B08401]" />
            </div>
            <p className="font-cinzel text-3xl sm:text-4xl text-[#683B2B] font-bold mt-4">
              {stats.totalTournaments}
            </p>
            <p className="text-xs text-[#7A6658] mt-1 font-sans">Championships recorded in archives</p>
          </div>
        </section>

        {/* OFFLINE NOTICE BANNER (IF SERVER UNREACHABLE) */}
        {offline && (
          <div className="border border-[#DED1BD] bg-[#FFFFFF] rounded-[14px] p-5 sm:p-6 shadow-sm flex flex-col sm:row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2">
                <span className="text-[#B08401] font-cinzel text-sm font-semibold">⚠ Standalone Engine Mode Active</span>
              </div>
              <p className="text-xs sm:text-sm text-[#7A6658]">
                Backend server is currently syncing. You can continue managing tournaments locally in Standalone Engine mode.
              </p>
            </div>
            <RoyalButton to="/standalone" variant="primary">
              Launch Standalone Engine
            </RoyalButton>
          </div>
        )}

        {/* LIVE ONLINE ARENA INVITATION BANNER */}
        <div className="relative overflow-hidden rounded-[14px] border border-[#DED1BD] bg-gradient-to-r from-[#FAF6F2] via-[#F4EEE7] to-[#FAF6F2] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2">
              <Swords size={15} className="text-[#B08401]" />
              <span className="font-cinzel text-xs uppercase tracking-[0.22em] text-[#B08401] font-semibold">
                Real-Time Multiplayer Parlor
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#683B2B] tracking-tight">
              Play Live Chess with Immediate Sync
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6658] max-w-xl">
              Server-authoritative move legality verification, Fischer decrement timers, instant challenge invitations, and live spectator broadcast.
            </p>
          </div>
          <RoyalButton to="/arena" variant="primary" className="shrink-0">
            Enter Live Arena <ArrowRight size={14} className="ml-1.5" />
          </RoyalButton>
        </div>

        {/* TOURNAMENT REGISTRY SECTION */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DED1BD] pb-4">
            <div>
              <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#B08401] font-semibold">
                Institutional Directory
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#683B2B] mt-0.5 tracking-tight">
                Sanctioned Championships
              </h2>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <RoyalChip active={filterMode === 'all'} onClick={() => setFilterMode('all')}>
                All Championships
              </RoyalChip>
              <RoyalChip active={filterMode === 'swiss'} onClick={() => setFilterMode('swiss')}>
                Swiss System
              </RoyalChip>
              <RoyalChip active={filterMode === 'round_robin'} onClick={() => setFilterMode('round_robin')}>
                Round Robin
              </RoyalChip>
              <RoyalChip active={filterMode === 'active'} onClick={() => setFilterMode('active')}>
                Live Active
              </RoyalChip>
              <RoyalChip active={filterMode === 'completed'} onClick={() => setFilterMode('completed')}>
                Archived
              </RoyalChip>
            </div>
          </div>

          {loading ? (
            <RoyalLoading message="Retrieving institutional registry…" />
          ) : filteredTournaments.length === 0 ? (
            <RoyalEmpty
              title="No Championships Recorded"
              description={offline ? 'Working offline. Standalone engine is ready.' : 'No tournaments match the selected filter. Inaugurate a new championship from the arbiter console.'}
              actionLabel="Inaugurate Tournament"
              actionTo="/admin/tournaments/new"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTournaments.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="group block focus:outline-none"
                >
                  <RoyalCard interactive className="h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-xl sm:text-2xl text-[#683B2B] group-hover:text-[#B08401] transition-colors line-clamp-1 tracking-tight">
                          {t.name}
                        </h3>
                        <StatusBadge status={t.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <ModeBadge mode={t.mode} />
                        {t.timeControl && (
                          <span className="font-cinzel text-[11px] text-[#7A6658] border border-[#DED1BD] px-2 py-0.5 rounded-full bg-[#FAF6F2]">
                            {t.timeControl}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-5 mt-5 border-t border-[#DED1BD]">
                      <div>
                        <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658]">
                          Competitors
                        </span>
                        <p className="font-cinzel text-lg font-bold text-[#683B2B] mt-0.5">
                          {t.participants?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        <span className="font-cinzel text-[11px] uppercase tracking-wider text-[#7A6658]">
                          Round Status
                        </span>
                        <p className="font-cinzel text-lg font-bold text-[#683B2B] mt-0.5">
                          <span className="text-[#B08401]">{t.currentRound}</span>
                          <span className="text-[#7A6658] font-normal text-sm"> / {t.roundsPlanned}</span>
                        </p>
                      </div>
                    </div>
                  </RoyalCard>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <RoyalFooter />
    </div>
  )
}
