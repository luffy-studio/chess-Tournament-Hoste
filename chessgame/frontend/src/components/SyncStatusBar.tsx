import { useOfflineStatus } from '../hooks/useOfflineStatus';

export function SyncStatusBar() {
  const { isOnline, mode } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-sm py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block"></span>
        <span>
          <strong>Offline Mode</strong> — Tournament data is saved locally. Changes will sync when connection returns.
        </span>
      </div>
      <span className="text-amber-100 text-xs">{mode === 'standalone' ? 'Standalone' : 'LAN'}</span>
    </div>
  );
}
