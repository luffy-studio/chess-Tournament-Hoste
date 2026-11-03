import { useState, useEffect } from 'react';
import { storage } from '../storage/StorageAdapter';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [mode, setMode] = useState<string>('checking');

  useEffect(() => {
    const update = async () => {
      const online = await storage.checkConnectivity();
      setIsOnline(online);
      setMode(storage.getMode());
    };

    update();

    const handleOnline = () => { update(); };
    const handleOffline = () => { setIsOnline(false); setMode('standalone'); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll every 30 seconds
    const interval = setInterval(update, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, mode };
}
