import { Trophy, Shuffle, Users2 } from 'lucide-react';
import { Mode } from '../types';

interface SummaryCardsProps {
  currentRound: number;
  mode: Mode;
  participantsCount: number;
  leaderName: string;
}

export function SummaryCards({ currentRound, mode, participantsCount, leaderName }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">Round</span>
          <Shuffle className="h-4 w-4" />
        </div>
        <div className="mt-2 text-3xl font-semibold">{currentRound}</div>
        <p className="text-xs text-zinc-500">
          {mode === "swiss" ? "Pair next round from standings" : "Navigate through pre-set rounds"}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">Participants</span>
          <Users2 className="h-4 w-4" />
        </div>
        <div className="mt-2 text-3xl font-semibold">{participantsCount}</div>
        <p className="text-xs text-zinc-500">BYE handled automatically if odd</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">Leader</span>
          <Trophy className="h-4 w-4" />
        </div>
        <div className="mt-2 text-3xl font-semibold">{leaderName}</div>
        <p className="text-xs text-zinc-500">Tie-breakers later; preview totals only</p>
      </div>
    </section>
  );
}
