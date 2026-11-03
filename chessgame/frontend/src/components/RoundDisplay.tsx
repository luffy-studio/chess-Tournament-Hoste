import { Mode } from '../types';

interface RoundDisplayProps {
  currentRound: number;
  mode: Mode;
}

export function RoundDisplay({ currentRound, mode }: RoundDisplayProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Current Round: {currentRound}</h2>
          <p className="text-sm text-zinc-600">View the pairings and standings below</p>
        </div>
        <div className="text-sm text-zinc-600">
          Mode: <span className="font-medium uppercase">{mode}</span>
        </div>
      </div>
    </div>
  );
}
