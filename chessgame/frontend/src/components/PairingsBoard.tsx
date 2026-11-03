import { useState, KeyboardEvent, useCallback } from "react";
import { Edit2, Trash2, Save, X } from "lucide-react";

import { Match, BYE_ID, UserRole, Result, Participant } from "../types";
import { ScoreToggle } from "./ScoreToggle";

interface PairingsBoardProps {
  matches: Match[];
  players: Participant[];
  userRole: UserRole;
  isAdminAuthenticated: boolean;
  byePoints: number;
  onUpdateResult: (id: number, result: Exclude<Result, null>) => void;
  onEditParticipant: (id: number, newName: string) => void;
  onRemoveParticipant: (id: number) => void;
  onAddParticipant?: (name: string) => void; // optional
}

export function PairingsBoard({
  matches,
  players,
  userRole,
  isAdminAuthenticated,
  byePoints,
  onUpdateResult,
  onEditParticipant,
  onRemoveParticipant,
  onAddParticipant,
}: PairingsBoardProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // NEW: add participant state
  const [newParticipantName, setNewParticipantName] = useState("");

  // ---------- helpers ----------
  const getById = useCallback(
    (id: number) => players.find((p) => p.id === id) || null,
    [players]
  );

  const getResultDisplay = (m: Match) => {
    if (m.whiteId === BYE_ID || m.blackId === BYE_ID) return "BYE";
    if (!m.result) return "–";
    if (m.result === "W") return "1–0";
    if (m.result === "L") return "0–1";
    if (m.result === "D") return "½–½";
    return "–";
  };

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = () => {
    const value = editName.trim();
    if (editingId !== null && value) {
      onEditParticipant(editingId, value);
    }
    setEditingId(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const handleDelete = (p: Participant) => {
    if (
      window.confirm(
        `Remove ${p.name} from tournament? This will affect pairings and standings.`
      )
    ) {
      if (editingId === p.id) cancelEdit();
      onRemoveParticipant(p.id);
    }
  };

  // NEW: add participant logic
  const canAdmin = userRole === "admin" && isAdminAuthenticated && typeof onAddParticipant === "function";

  const addParticipant = () => {
    if (!canAdmin) return;
    const value = newParticipantName.trim();
    if (!value) return;

    // basic duplicate check by name (case-insensitive)
    const exists = players.some(
      (p) => p.name.trim().toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      alert("Participant with same name already exists.");
      return;
    }

    onAddParticipant!(value);
    setNewParticipantName("");
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addParticipant();
    if (e.key === "Escape") setNewParticipantName("");
  };

  // Single cell renderer used in both mobile/desktop layouts
  const renderParticipantCell = (id: number, colorLabel?: "W" | "B") => {
    if (id === BYE_ID) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          {colorLabel && (
            <span className="hidden md:inline-flex shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
              {colorLabel}
            </span>
          )}
          <span className="text-zinc-500">BYE</span>
        </div>
      );
    }

    const p = getById(id);
    if (!p) return <span className="text-zinc-400">Unknown</span>;

    const isEditing = editingId === id;
    const isAdmin = userRole === "admin" && isAdminAuthenticated;

    if (!isAdmin) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          {colorLabel && (
            <span className="hidden md:inline-flex shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
              {colorLabel}
            </span>
          )}
          <span className="truncate font-medium">{p.name}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 min-w-0">
        {colorLabel && (
          <span className="hidden md:inline-flex shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
            {colorLabel}
          </span>
        )}

        {isEditing ? (
          <>
            <input
              type="text"
              className="min-w-0 flex-1 rounded-lg border px-2 py-2 text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={cancelEdit}
              autoFocus
              aria-label={`Edit ${p.name}`}
            />
            <button
              className="rounded-md border border-green-600 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              onMouseDown={(e) => e.preventDefault()}
              onClick={saveEdit}
              title="Save"
              type="button"
              aria-label="Save"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancelEdit}
              title="Cancel"
              type="button"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span className="truncate font-medium">{p.name}</span>
            <button
              className="shrink-0 rounded-md border px-2.5 py-1.5 text-xs hover:bg-zinc-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
              onClick={() => startEdit(p)}
              title="Edit name"
              type="button"
              aria-label={`Edit ${p.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              className="shrink-0 rounded-md border border-red-600 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              onClick={() => handleDelete(p)}
              title="Remove participant"
              type="button"
              aria-label={`Remove ${p.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  };

  // ---------- UI ----------
  return (
    <div className="md:col-span-2 space-y-4">
      <section className="rounded-2xl border bg-white p-2 sm:p-3">

        {/* NEW: Admin add participant bar */}
        {canAdmin && (
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-zinc-50 px-3 py-3">
            <div className="text-sm font-medium text-zinc-700">
              Add Participant (Manual)
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                type="text"
                placeholder="e.g., Ramesh Kumar"
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                aria-label="New participant name"
              />
              <button
                type="button"
                onClick={addParticipant}
                disabled={!newParticipantName.trim()}
                className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                title="Add participant"
                aria-label="Add participant"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Desktop header with sticky top */}
        <div className="hidden md:grid grid-cols-12 items-center gap-2 border-b px-3 py-2 text-xs font-medium text-zinc-600 sticky top-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 z-10">
          <div className="col-span-1">Board</div>
          <div className="col-span-4">Participant A (White)</div>
          <div className="col-span-3">{userRole === "admin" ? "Score" : "Result"}</div>
          <div className="col-span-4">Participant B (Black)</div>
        </div>

        {/* MOBILE: stacked cards */}
        <div className="md:hidden space-y-3">
          {matches.map((m) => (
            <article
              key={m.id}
              className="rounded-xl border bg-white p-3 shadow-sm transition-colors hover:bg-zinc-50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-2 font-semibold text-zinc-800">
                    {m.board}
                  </span>
                  Board
                </span>

                {userRole === "admin" && isAdminAuthenticated ? (
                  m.whiteId === BYE_ID || m.blackId === BYE_ID ? (
                    <span className="text-[11px] text-zinc-600">
                      BYE (auto {byePoints})
                    </span>
                  ) : (
                    <div className="ml-2">
                      <ScoreToggle
                        value={m.result}
                        onChange={(v) => {
                          if (v !== null) onUpdateResult(m.id, v);
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div className="text-sm font-semibold text-zinc-800">
                    {getResultDisplay(m)}
                  </div>
                )}
              </div>

              {/* White */}
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
                  W
                </span>
                <div className="min-w-0 flex-1">{renderParticipantCell(m.whiteId)}</div>
              </div>

              <div className="my-2 h-px bg-zinc-100" />

              {/* Black */}
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
                  B
                </span>
                <div className="min-w-0 flex-1">{renderParticipantCell(m.blackId)}</div>
              </div>
            </article>
          ))}
        </div>

        {/* DESKTOP/TABLET: grid table */}
        <div className="hidden md:block max-h-[70vh] overflow-auto">
          {matches.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-12 items-center gap-2 px-3 py-3 hover:bg-zinc-50"
            >
              <div className="col-span-1 font-semibold">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-2">
                  {m.board}
                </span>
              </div>

              {/* White */}
              <div className="col-span-4 min-w-0">{renderParticipantCell(m.whiteId, "W")}</div>

              {/* Score / Result */}
              <div className="col-span-3">
                {userRole === "admin" && isAdminAuthenticated ? (
                  m.whiteId === BYE_ID || m.blackId === BYE_ID ? (
                    <div className="text-xs text-zinc-600">BYE (auto {byePoints})</div>
                  ) : (
                    <ScoreToggle
                      value={m.result}
                      onChange={(v) => {
                        if (v !== null) onUpdateResult(m.id, v);
                      }}
                    />
                  )
                ) : (
                  <div className="text-sm font-medium text-zinc-700">
                    {getResultDisplay(m)}
                  </div>
                )}
              </div>

              {/* Black */} 
              <div className="col-span-4 min-w-0">{renderParticipantCell(m.blackId, "B")}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
