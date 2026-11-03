import { Standing, Participant, Match, BYE_ID } from '../types'
import { nameOf } from '../utils/tournamentUtils'

interface StandingsTableProps {
  standings: Standing[]
  players: Participant[]
  pairings: Match[]
}

export function StandingsTable({ standings, players, pairings }: StandingsTableProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-cinzel text-xs uppercase tracking-wider text-[#B18A52]">
          Official Broadsheet
        </p>
        <h2 className="font-serif text-2xl text-[#F3EDE3] mt-0.5 tracking-tight">
          Standings & Carry-Forward Ledger
        </h2>
      </div>

      <div className="rounded-[14px] border border-[#514538] bg-[#2E2925] overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#514538] bg-[#38312B]/70">
              <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#B9AEA0] px-4 py-3 w-16 text-center">#</th>
              <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#B9AEA0] px-4 py-3">Participant</th>
              <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#B9AEA0] px-4 py-3 text-center">Score</th>
              <th className="font-cinzel text-[11px] uppercase tracking-wider text-[#B9AEA0] px-4 py-3 text-center">Wins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#514538]/70 text-sm">
            {standings
              .filter((s) => s.id !== BYE_ID)
              .map((s, i) => {
                const wins = pairings.filter(
                  (m) =>
                    (m.result === 'W' && m.whiteId === s.id) ||
                    (m.result === 'L' && m.blackId === s.id)
                ).length
                return (
                  <tr key={s.id} className="hover:bg-[#38312B] transition">
                    <td className="font-cinzel text-xs font-bold text-[#B18A52] px-4 py-3 text-center">{i + 1}</td>
                    <td className="font-medium text-[#F3EDE3] px-4 py-3">{nameOf(s.id, players)}</td>
                    <td className="font-cinzel text-sm font-bold text-[#F3EDE3] px-4 py-3 text-center">{s.score.toFixed(1)}</td>
                    <td className="font-cinzel text-xs text-[#B9AEA0] px-4 py-3 text-center">{wins}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
