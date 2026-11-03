import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './api';

export interface CreateSocketOptions {
  authToken?: string | null;
  autoConnect?: boolean;
}

/**
 * Creates a robust Socket.IO client connection.
 * - Starts with HTTP polling for a reliable handshake, then upgrades to WebSocket.
 * - Dynamically derives server host address from the current browser location (works on localhost, LAN IP, and production).
 * - Implements exponential reconnection backoff with reasonable limits.
 */
export function createAppSocket(options: CreateSocketOptions = {}): Socket {
  const url = getSocketBaseUrl();
  const token = options.authToken !== undefined ? options.authToken : localStorage.getItem('chess_admin_token');

  const socket: Socket = io(url, {
    transports: ['polling', 'websocket'], // Robust standard: initial polling handshake followed by seamless websocket upgrade
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: options.autoConnect !== false,
    auth: token ? { token } : undefined,
  });

  return socket;
}
