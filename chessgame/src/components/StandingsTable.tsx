import { Standing, Participant, Match, BYE_ID } from '../types';
import { nameOf } from '../utils/tournamentUtils';

interface StandingsTableProps {
  standings: Standing[];
  players: Participant[];
  pairings: Match[];
}

export function StandingsTable({ standings, players, pairings }: StandingsTableProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Standings (Carry-forward)</h2>
      <div className="rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-600">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Participant</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Wins</th>
            </tr>
          </thead>
          <tbody>
            {standings
              .filter((s) => s.id !== BYE_ID)
              .map((s, i) => {
                const wins = pairings.filter(
                  (m) =>
                    (m.result === "W" && m.whiteId === s.id) ||
                    (m.result === "L" && m.blackId === s.id)
                ).length;
                return (
                  <tr key={s.id} className="border-b last:border-none">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{nameOf(s.id, players)}</td>
                    <td className="px-3 py-2 font-semibold">{s.score.toFixed(1)}</td>
                    <td className="px-3 py-2">{wins}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
