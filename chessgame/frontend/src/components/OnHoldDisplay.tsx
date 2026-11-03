import { UserCircle } from 'lucide-react';

interface OnHoldDisplayProps {
  holdName: string;
  userRole: 'admin' | 'participant';
  isAdminAuthenticated: boolean;
  onAddBack?: () => void;
}

export function OnHoldDisplay({
  holdName,
  userRole,
  isAdminAuthenticated,
  onAddBack,
}: OnHoldDisplayProps) {
  if (!holdName) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-200 p-2">
            <UserCircle className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <div className="text-sm font-medium text-amber-900">Participant On Hold</div>
            <div className="text-lg font-semibold text-amber-800">{holdName}</div>
            <p className="text-xs text-amber-700 mt-1">
              This participant is temporarily not participating in matches
            </p>
          </div>
        </div>
        {userRole === 'admin' && isAdminAuthenticated && onAddBack && (
          <button
            className="rounded-xl border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            onClick={onAddBack}
          >
            Add Back to Tournament
          </button>
        )}
      </div>
    </section>
  );
}
