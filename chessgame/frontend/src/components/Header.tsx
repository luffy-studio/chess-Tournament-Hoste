import { Crown, Plus, UserCog, Eye } from 'lucide-react';
import { UserRole, Mode } from '../types';

interface HeaderProps {
  userRole: UserRole;
  isAdminAuthenticated: boolean;
  mode: Mode;
  hasPlayers: boolean;
  onRoleChange: (role: UserRole) => void;
  onNewTournament: () => void;
  onLogout: () => void;
}

export function Header({
  userRole,
  isAdminAuthenticated,
  mode,
  hasPlayers,
  onRoleChange,
  onNewTournament,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Royal Chess Championship</h1>
          <p className="text-sm text-zinc-600">
            {userRole === "admin" ? "Admin Panel" : "Participant View"} •{" "}
            {hasPlayers ? (mode === "swiss" ? "Swiss" : "Round-robin") : "No active tournament"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Role Selector */}
        <div className="flex rounded-2xl border overflow-hidden">
          <button
            className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${
              userRole === "admin" ? "bg-black text-white" : "bg-white hover:bg-zinc-50"
            } ${!isAdminAuthenticated && userRole !== "admin" ? "cursor-pointer" : ""}`}
            onClick={() => onRoleChange("admin")}
            title={!isAdminAuthenticated ? "Login required" : ""}
          >
            <UserCog className="h-4 w-4" />
            Admin
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${
              userRole === "participant" ? "bg-black text-white" : "bg-white hover:bg-zinc-50"
            }`}
            onClick={() => onRoleChange("participant")}
          >
            <Eye className="h-4 w-4" />
            Participant
          </button>
        </div>
        {isAdminAuthenticated && userRole === "admin" && (
          <>
            {hasPlayers && (
              <button 
                className="rounded-2xl border px-3 py-2 text-sm font-medium hover:shadow" 
                onClick={onNewTournament}
              >
                New Tournament <Plus className="ml-1 inline h-4 w-4" />
              </button>
            )}
            <button
              className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium hover:bg-red-50 text-red-600"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
