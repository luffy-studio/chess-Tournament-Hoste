import { useState, useEffect, useCallback } from 'react';
import api from './api';
import { createAppSocket } from './socket';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export function useTournamentApi(tournamentId?: string) {
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchTournament = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch {
      // Don't spam toasts on every fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tournamentId) return;

    fetchTournament(tournamentId);

    const newSocket = createAppSocket();
    setSocket(newSocket);

    const onConnect = () => {
      newSocket.emit('joinTournament', tournamentId);
    };

    const onTournamentUpdated = (data: any) => {
      setTournament(data);
    };

    const onStandingsUpdated = (data: any) => {
      setTournament((prev: any) => (prev ? { ...prev, participants: data.standings } : prev));
    };

    const onRoundGenerated = () => {
      fetchTournament(tournamentId);
      toast.success('New round pairings generated!');
    };

    const onAnnouncementPosted = (announcement: any) => {
      setTournament((prev: any) => {
        if (!prev) return prev;
        const current = prev.announcements || [];
        return { ...prev, announcements: [announcement, ...current] };
      });
      toast(`Announcement: ${announcement.message}`, { icon: '📢' });
    };

    newSocket.on('connect', onConnect);
    newSocket.on('tournamentUpdated', onTournamentUpdated);
    newSocket.on('standings:updated', onStandingsUpdated);
    newSocket.on('round:generated', onRoundGenerated);
    newSocket.on('announcement:posted', onAnnouncementPosted);

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('tournamentUpdated', onTournamentUpdated);
      newSocket.off('standings:updated', onStandingsUpdated);
      newSocket.off('round:generated', onRoundGenerated);
      newSocket.off('announcement:posted', onAnnouncementPosted);

      newSocket.emit('leaveTournament', tournamentId);
      newSocket.disconnect();
    };
  }, [tournamentId, fetchTournament]);

  return {
    tournament,
    loading,
    socket,
    refresh: () => tournamentId && fetchTournament(tournamentId),
  };
}
