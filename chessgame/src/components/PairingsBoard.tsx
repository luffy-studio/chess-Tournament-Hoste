import { Match, Participant, BYE_ID, UserRole, Result } from '../types';
import { nameOf } from '../utils/tournamentUtils';
import { ScoreToggle } from './ScoreToggle';

interface PairingsBoardProps {
  matches: Match[];
  players: Participant[];
  userRole: UserRole;
  isAdminAuthenticated: boolean;
  byePoints: number;
  onUpdateResult: (id: number, result: Exclude<Result, null>) => void;
}

export function PairingsBoard({
  matches,
  players,
  userRole,
  isAdminAuthenticated,
  byePoints,
  onUpdateResult,
}: PairingsBoardProps) {
  const getResultDisplay = (m: Match) => {
    if (m.whiteId === BYE_ID || m.blackId === BYE_ID) return "BYE";
    if (!m.result) return "–";
    if (m.result === "W") return "1–0";
    if (m.result === "L") return "0–1";
    if (m.result === "D") return "½–½";
    return "–";
  };

  return (
    <div className="md:col-span-2 space-y-4">
      <div className="rounded-2xl border bg-white p-2">
        <div className="grid grid-cols-12 items-center gap-2 border-b px-3 py-2 text-xs font-medium text-zinc-600">
          <div className="col-span-1">Board</div>
          <div className="col-span-4">Participant A (White)</div>
          <div className="col-span-3">{userRole === "admin" ? "Score" : "Result"}</div>
          <div className="col-span-4">Participant B (Black)</div>
        </div>

        {matches.map((m) => (
          <div key={m.id} className="grid grid-cols-12 items-center gap-2 px-3 py-3 hover:bg-zinc-50">
            <div className="col-span-1 font-semibold">{m.board}</div>
            <div className="col-span-4 truncate">{nameOf(m.whiteId, players)}</div>
            <div className="col-span-3">
              {userRole === "admin" && isAdminAuthenticated ? (
                m.whiteId === BYE_ID || m.blackId === BYE_ID ? (
                  <div className="text-xs text-zinc-600">BYE (auto {byePoints})</div>
                ) : (
                  <ScoreToggle value={m.result} onChange={(v) => onUpdateResult(m.id, v)} />
                )
              ) : (
                <div className="text-sm font-medium text-zinc-700">{getResultDisplay(m)}</div>
              )}
            </div>
            <div className="col-span-4 truncate">{nameOf(m.blackId, players)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
