import { Participant } from '../types';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onEditParticipant: (id: number, newName: string) => void;
  onRemoveParticipant: (id: number) => void;
}

export function ParticipantManager({
  
  onAddParticipant
}: ParticipantManagerProps) {
  const [newName, setNewName] = useState('');
  const handleAdd = () => {
    if (newName.trim()) {
      onAddParticipant(newName.trim());
      setNewName('');
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Manage Participants</h2>
        <p className="text-sm text-zinc-600">
          Add, edit, or remove participants during the tournament
        </p>
      </div>

      {/* Add New Participant */}
      <div className="mb-4 pb-4 border-b">
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Add New Participant
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="Enter participant name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            onClick={handleAdd}
            disabled={!newName.trim()}
          >
            <UserPlus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800">
          <strong>⚠️ Warning:</strong> Adding or removing participants during a
          tournament may affect pairings and results. Changes take effect
          immediately.
        </p>
      </div>
    </section>
  );
}
