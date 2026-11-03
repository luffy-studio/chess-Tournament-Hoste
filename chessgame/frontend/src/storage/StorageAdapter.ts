// StorageAdapter.ts
// Detects whether backend is reachable and switches accordingly

import api from '../utils/api';
import {
  getAllTournamentsLocal,
  getTournamentLocal,
  saveTournamentLocal,
  getParticipantsLocal,
  saveParticipantLocal,
  getMatchesLocal,
  saveMatchLocal,
  addToSyncQueue,
} from './db';

export type OperatingMode = 'standalone' | 'lan' | 'online';

export class StorageAdapter {
  private mode: OperatingMode = 'standalone';
  private isOnline: boolean = false;

  constructor() {
    this.checkConnectivity();
    window.addEventListener('online', () => this.checkConnectivity());
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.mode = 'standalone';
    });
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await api.get('/system/info', { timeout: 3000 });
      this.isOnline = true;
      this.mode = window.location.hostname === 'localhost' ? 'lan' : 'online';
      return true;
    } catch {
      this.isOnline = false;
      this.mode = 'standalone';
      return false;
    }
  }

  getMode(): OperatingMode { return this.mode; }
  getIsOnline(): boolean { return this.isOnline; }

  async getAllTournaments(): Promise<unknown[]> {
    if (this.isOnline) {
      const res = await api.get('/tournaments');
      // Also cache locally
      for (const t of res.data) {
        await saveTournamentLocal({ ...t, createdAt: t.createdAt || new Date().toISOString(), updatedAt: t.updatedAt || new Date().toISOString() });
      }
      return res.data;
    }
    return getAllTournamentsLocal();
  }

  async getTournament(id: string): Promise<unknown> {
    if (this.isOnline) {
      const res = await api.get(`/tournaments/${id}`);
      return res.data;
    }
    const tournament = await getTournamentLocal(id);
    if (!tournament) throw new Error('Tournament not found');
    const participants = await getParticipantsLocal(id);
    const matches = await getMatchesLocal(id);
    return { ...tournament, participants, matches };
  }

  async createTournament(data: Record<string, unknown>): Promise<unknown> {
    if (this.isOnline) {
      const res = await api.post('/tournaments', data);
      await saveTournamentLocal({ ...res.data, createdAt: res.data.createdAt || new Date().toISOString(), updatedAt: res.data.updatedAt || new Date().toISOString() });
      return res.data;
    }
    // Offline: create locally
    const id = crypto.randomUUID();
    const tournament = {
      id,
      ...data,
      status: 'setup' as const,
      currentRound: 1,
      holdName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTournamentLocal(tournament as Parameters<typeof saveTournamentLocal>[0]);
    await addToSyncQueue({ type: 'CREATE_TOURNAMENT', payload: tournament, createdAt: new Date().toISOString(), attempts: 0 });
    return tournament;
  }

  async addParticipant(tournamentId: string, data: Record<string, unknown>): Promise<unknown> {
    if (this.isOnline) {
      const res = await api.post(`/tournaments/${tournamentId}/participants`, data);
      await saveParticipantLocal(res.data);
      return res.data;
    }
    const id = crypto.randomUUID();
    const participant = { id, tournamentId, score: 0, isUnrated: true, nationalRating: null, title: null, rating: 1200, ...data };
    await saveParticipantLocal(participant as Parameters<typeof saveParticipantLocal>[0]);
    await addToSyncQueue({ type: 'ADD_PARTICIPANT', payload: { tournamentId, participant }, createdAt: new Date().toISOString(), attempts: 0 });
    return participant;
  }

  async submitResult(tournamentId: string, matchId: string, result: string): Promise<unknown> {
    if (this.isOnline) {
      const res = await api.put(`/tournaments/${tournamentId}/matches/${matchId}`, { result });
      return res.data;
    }
    // Offline: update locally
    const matches = await getMatchesLocal(tournamentId);
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const updated = { ...match, result: result as 'W' | 'L' | 'D' | null };
      await saveMatchLocal(updated);
      await addToSyncQueue({ type: 'SUBMIT_RESULT', payload: { tournamentId, matchId, result }, createdAt: new Date().toISOString(), attempts: 0 });
      return updated;
    }
    throw new Error('Match not found');
  }
}

export const storage = new StorageAdapter();
