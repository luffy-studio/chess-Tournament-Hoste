import { UserRole } from '../types';

interface FooterProps {
  byePoints: number;
  userRole: UserRole;
  isAdminAuthenticated: boolean;
  onExportResults: () => void;
  onExportStandings: () => void;
  onExportBoards: () => void;
}

export function Footer({
  byePoints,
  userRole,
  isAdminAuthenticated,
  onExportResults,
  onExportStandings,
  onExportBoards,
}: FooterProps) {
  return (
    <footer className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-3 text-sm text-zinc-600">
      <div>Scoring: Win = 1, Draw = 0.5, Loss = 0 • BYE = {byePoints}</div>
      {userRole === "admin" && isAdminAuthenticated && (
        <div className="space-x-2">
          <button className="rounded-2xl border px-3 py-2 font-medium" onClick={onExportResults}>
            Export Results CSV
          </button>
          <button className="rounded-2xl border px-3 py-2 font-medium" onClick={onExportStandings}>
            Export Standings CSV
          </button>
          <button className="rounded-2xl border px-3 py-2 font-medium" onClick={onExportBoards}>
            Export Boards CSV
          </button>
        </div>
      )}
    </footer>
  );
}
