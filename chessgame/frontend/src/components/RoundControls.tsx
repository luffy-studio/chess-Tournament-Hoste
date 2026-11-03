import { ArrowRight } from 'lucide-react';
import { Mode } from '../types';

interface RoundControlsProps {
  mode: Mode;
  currentRound: number;
  totalRounds: number;
  onNextRound: () => void;
  onPrevRound: () => void;
  onNextRoundClick: () => void;
}

export function RoundControls({ 
  mode, 
  currentRound, 
  totalRounds,
  onNextRound, 
  onPrevRound,
  onNextRoundClick
}: RoundControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-zinc-600">
        Mode: <span className="font-medium uppercase">{mode}</span>
      </div>
      {mode === "swiss" ? (
        <button 
          onClick={onNextRoundClick} 
          className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Generate Next Round <ArrowRight className="ml-1 inline h-4 w-4" />
        </button>
      ) : (
        <div className="space-x-2">
          <button
            className="rounded-2xl border px-3 py-2 text-sm font-medium"
            onClick={onPrevRound}
            disabled={currentRound <= 1}
          >
            Prev
          </button>
          <button
            className="rounded-2xl border px-3 py-2 text-sm font-medium"
            onClick={onNextRound}
            disabled={currentRound >= totalRounds}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
