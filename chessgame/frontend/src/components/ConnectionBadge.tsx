import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ConnectionBadgeProps {
  socket: Socket | null;
  className?: string;
  showLabel?: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  socket,
  className = '',
  showLabel = true,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    if (!socket) return 'disconnected';
    return socket.connected ? 'connected' : 'connecting';
  });

  useEffect(() => {
    if (!socket) {
      setStatus('disconnected');
      return;
    }

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onConnectError = () => {
      // If was connected or trying to reconnect, mark as reconnecting/disconnected
      setStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'disconnected'));
    };
    const onReconnectAttempt = () => setStatus('reconnecting');
    const onReconnect = () => setStatus('connected');
    const onReconnectFailed = () => setStatus('disconnected');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (socket.io) {
      socket.io.on('reconnect_attempt', onReconnectAttempt);
      socket.io.on('reconnect', onReconnect);
      socket.io.on('reconnect_failed', onReconnectFailed);
    }

    // Set initial status
    setStatus(socket.connected ? 'connected' : 'connecting');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);

      if (socket.io) {
        socket.io.off('reconnect_attempt', onReconnectAttempt);
        socket.io.off('reconnect', onReconnect);
        socket.io.off('reconnect_failed', onReconnectFailed);
      }
    };
  }, [socket]);

  const config = {
    connected: {
      dot: 'bg-[#5B6E57]',
      text: 'text-[#5B6E57]',
      bg: 'bg-[#5B6E57]/10 border-[#5B6E57]/30',
      label: 'Live Synchronized',
      tooltip: 'Real-time WebSocket connection verified',
    },
    connecting: {
      dot: 'bg-[#B18A52] animate-pulse',
      text: 'text-[#B18A52]',
      bg: 'bg-[#B18A52]/10 border-[#B18A52]/30',
      label: 'Connecting…',
      tooltip: 'Connecting to arbiter relay',
    },
    reconnecting: {
      dot: 'bg-[#B18A52] animate-pulse',
      text: 'text-[#B18A52]',
      bg: 'bg-[#B18A52]/10 border-[#B18A52]/30',
      label: 'Reconnecting…',
      tooltip: 'Re-establishing live channel',
    },
    disconnected: {
      dot: 'bg-[#9E948A]',
      text: 'text-[#B9AEA0]',
      bg: 'bg-[#302A25] border-[#514538]',
      label: 'Offline Cache',
      tooltip: 'Offline cache active',
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border select-none transition-colors duration-200 ${config.bg} ${config.text} ${className}`}
      title={config.tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};
