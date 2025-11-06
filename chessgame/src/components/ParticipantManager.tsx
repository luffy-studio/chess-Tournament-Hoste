import { Participant } from '../types';
import { UserPlus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useState } from 'react';

interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onEditParticipant: (id: number, newName: string) => void;
  onRemoveParticipant: (id: number) => void;
}

export function ParticipantManager({
  participants,
  onAddParticipant,
  onEditParticipant,
  onRemoveParticipant,
}: ParticipantManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      onAddParticipant(newName.trim());
      setNewName('');
    }
  };

  const startEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditName(participant.name);
  };

  const saveEdit = () => {
    if (editingId !== null && editName.trim()) {
      onEditParticipant(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
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

      {/* Participant List */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Current Participants ({participants.length})
        </label>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {participants
            .filter((p) => p.id !== -1) // Filter out BYE
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-zinc-50"
              >
                {editingId === participant.id ? (
                  <>
                    <input
                      type="text"
                      className="flex-1 rounded-lg border px-2 py-1 mr-2"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        className="rounded-md border border-green-600 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        onClick={saveEdit}
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-zinc-100"
                        onClick={cancelEdit}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">
                        #{participant.id}
                      </span>
                      <span className="font-medium">{participant.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-zinc-100"
                        onClick={() => startEdit(participant)}
                        title="Edit name"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md border border-red-600 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${participant.name} from tournament? This will affect pairings.`
                            )
                          ) {
                            onRemoveParticipant(participant.id);
                          }
                        }}
                        title="Remove participant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
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
