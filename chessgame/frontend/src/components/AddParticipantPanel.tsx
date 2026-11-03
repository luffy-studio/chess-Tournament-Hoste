import { Mode } from '../types';

interface AddParticipantPanelProps {
  mode: Mode;
  newName: string;
  queue: string[];
  onNewNameChange: (v: string) => void;
  onAddToQueue: () => void;
  onRemoveFromQueue: (index: number) => void;
}

export function AddParticipantPanel({
  mode,
  newName,
  queue,
  onNewNameChange,
  onAddToQueue,
  onRemoveFromQueue,
}: AddParticipantPanelProps) {
  const disabled = mode === 'roundrobin';

  return (
    <section className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Add Participant (Next Round)</h2>
        {disabled && (
          <span className="text-xs text-zinc-500">Not supported in Round-robin</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Enter participant name"
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          disabled={disabled}
        />
        <button
          className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          onClick={onAddToQueue}
          disabled={disabled || !newName.trim()}
        >
          Add
        </button>
      </div>

      {queue.length > 0 && (
        <div className="mt-3">
          <div className="text-sm text-zinc-600 mb-1">Queued for next round:</div>
          <ul className="space-y-1">
            {queue.map((n, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="truncate">{n}</span>
                <button
                  className="text-xs rounded-md border px-2 py-1 hover:bg-zinc-50"
                  onClick={() => onRemoveFromQueue(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-zinc-500">
            These names will be added to the player list when you generate the next round (Swiss only).
          </div>
        </div>
      )}
    </section>
  );
}
