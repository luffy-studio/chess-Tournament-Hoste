import { Mode } from '../types';

interface SetupWizardProps {
  namesText: string;
  mode: Mode;
  roundsPlanned: number;
  byePoints: number;
  holdName: string;
  onNamesChange: (v: string) => void;
  onModeChange: (v: Mode) => void;
  onRoundsPlannedChange: (v: number) => void;
  onByePointsChange: (v: number) => void;
  onMoveLastToHold: () => void;
  onAddHoldBack: () => void;
  onStart: () => void;
}

export function SetupWizard({
  namesText,
  mode,
  roundsPlanned,
  byePoints,
  holdName,
  onNamesChange,
  onModeChange,
  onRoundsPlannedChange,
  onByePointsChange,
  onMoveLastToHold,
  onAddHoldBack,
  onStart,
}: SetupWizardProps) {
  const uniqueList = Array.from(
    new Set(
      namesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  const isOdd = uniqueList.length % 2 === 1;
  const oddCandidate = isOdd ? uniqueList[uniqueList.length - 1] : '';

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2 rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Participants</h2>
        <p className="text-sm text-zinc-600 mb-2">Enter one name per line. We'll set opponents and rounds automatically.</p>
        <textarea
          className="h-48 w-full rounded-xl border p-3 focus:outline-none"
          value={namesText}
          onChange={(e) => onNamesChange(e.target.value)}
          placeholder="One name per line"
        />
        {(isOdd || holdName) && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {isOdd && !holdName && (
              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-sm font-medium">Unpaired (odd count)</div>
                <div className="mt-1 text-sm text-zinc-700 truncate">{oddCandidate}</div>
                <button
                  className="mt-2 rounded-xl border px-3 py-1 text-xs font-medium"
                  onClick={onMoveLastToHold}
                >
                  Move to Hold
                </button>
              </div>
            )}
            {holdName && (
              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="text-sm font-medium">On Hold</div>
                <div className="mt-1 text-sm text-zinc-700 truncate">{holdName}</div>
                <button
                  className="mt-2 rounded-xl border px-3 py-1 text-xs font-medium"
                  onClick={onAddHoldBack}
                >
                  Add Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border bg-white p-4">
          <label className="text-sm text-zinc-700">Format</label>
          <select
            className="mt-1 w-full rounded-xl border p-2"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as Mode)}
          >
            <option value="swiss">Swiss (pair by score each round)</option>
            <option value="roundrobin">Round-robin (all rounds pre-set)</option>
          </select>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <label className="text-sm text-zinc-700">Planned Rounds {mode === "roundrobin" && <span className="text-xs text-zinc-500">(auto for RR)</span>}</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border p-2"
            value={roundsPlanned}
            onChange={(e) => onRoundsPlannedChange(parseInt(e.target.value || "1", 10))}
            disabled={mode === "roundrobin"}
          />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <label className="text-sm text-zinc-700">Bye Points</label>
          <select className="mt-1 w-full rounded-xl border p-2" value={byePoints} onChange={(e) => onByePointsChange(parseFloat(e.target.value))}>
            <option value={1}>1.0 (full point)</option>
            <option value={0.5}>0.5</option>
            <option value={0}>0</option>
          </select>
        </div>
        <button onClick={onStart} className="w-full rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Start Tournament
        </button>
      </div>
    </section>
  );
}
