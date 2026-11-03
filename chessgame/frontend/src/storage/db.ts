import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChessDB extends DBSchema {
  tournaments: {
    key: string;
    value: {
      id: string;
      name: string;
      mode: 'swiss' | 'roundrobin';
      status: 'setup' | 'ongoing' | 'completed';
      currentRound: number;
      roundsPlanned: number;
      byePoints: number;
      holdName: string | null;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { 'by-status': string };
  };
  participants: {
    key: string;
    value: {
      id: string;
      tournamentId: string;
      name: string;
      score: number;
      rating: number;
      nationalRating: number | null;
      isUnrated: boolean;
      title: string | null;
    };
    indexes: { 'by-tournament': string };
  };
  matches: {
    key: string;
    value: {
      id: string;
      tournamentId: string;
      round: number;
      board: number;
      whiteId: string | null;
      blackId: string | null;
      result: 'W' | 'L' | 'D' | null;
      isManual: boolean;
    };
    indexes: { 'by-tournament': string; 'by-round': string };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      type: 'CREATE_TOURNAMENT' | 'UPDATE_TOURNAMENT' | 'ADD_PARTICIPANT' | 'REMOVE_PARTICIPANT' | 'SUBMIT_RESULT';
      payload: unknown;
      createdAt: string;
      attempts: number;
    };
  };
}

const DB_NAME = 'chess-tournament-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChessDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ChessDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tournaments store
        const tournamentStore = db.createObjectStore('tournaments', { keyPath: 'id' });
        tournamentStore.createIndex('by-status', 'status');

        // Participants store
        const participantStore = db.createObjectStore('participants', { keyPath: 'id' });
        participantStore.createIndex('by-tournament', 'tournamentId');

        // Matches store
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
        matchStore.createIndex('by-tournament', 'tournamentId');
        matchStore.createIndex('by-round', 'round');

        // Sync queue (for when connectivity returns)
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

// Tournament operations
export async function saveTournamentLocal(tournament: ChessDB['tournaments']['value']) {
  const db = await getDB();
  return db.put('tournaments', { ...tournament, updatedAt: new Date().toISOString() });
}

export async function getTournamentLocal(id: string) {
  const db = await getDB();
  return db.get('tournaments', id);
}

export async function getAllTournamentsLocal() {
  const db = await getDB();
  return db.getAll('tournaments');
}

export async function deleteTournamentLocal(id: string) {
  const db = await getDB();
  const tx = db.transaction(['tournaments', 'participants', 'matches'], 'readwrite');
  await tx.objectStore('tournaments').delete(id);

  // Delete related participants
  const participants = await tx.objectStore('participants').index('by-tournament').getAll(id);
  for (const p of participants) {
    await tx.objectStore('participants').delete(p.id);
  }

  // Delete related matches
  const matches = await tx.objectStore('matches').index('by-tournament').getAll(id);
  for (const m of matches) {
    await tx.objectStore('matches').delete(m.id);
  }

  await tx.done;
}

// Participant operations
export async function saveParticipantLocal(participant: ChessDB['participants']['value']) {
  const db = await getDB();
  return db.put('participants', participant);
}

export async function getParticipantsLocal(tournamentId: string) {
  const db = await getDB();
  return db.getAllFromIndex('participants', 'by-tournament', tournamentId);
}

export async function deleteParticipantLocal(id: string) {
  const db = await getDB();
  return db.delete('participants', id);
}

// Match operations
export async function saveMatchLocal(match: ChessDB['matches']['value']) {
  const db = await getDB();
  return db.put('matches', match);
}

export async function getMatchesLocal(tournamentId: string) {
  const db = await getDB();
  return db.getAllFromIndex('matches', 'by-tournament', tournamentId);
}

// Sync queue operations
export async function addToSyncQueue(item: Omit<ChessDB['syncQueue']['value'], 'id'>) {
  const db = await getDB();
  return db.add('syncQueue', { ...item, attempts: 0 });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function removeSyncQueueItem(id: number) {
  const db = await getDB();
  return db.delete('syncQueue', id);
}

// Export all data for a tournament (for backup)
export async function exportTournamentLocal(tournamentId: string) {
  const tournament = await getTournamentLocal(tournamentId);
  const participants = await getParticipantsLocal(tournamentId);
  const matches = await getMatchesLocal(tournamentId);
  return { tournament, participants, matches, exportedAt: new Date().toISOString() };
}

// Import from JSON backup
export async function importTournamentLocal(data: { tournament: ChessDB['tournaments']['value']; participants: ChessDB['participants']['value'][]; matches: ChessDB['matches']['value'][] }) {
  if (!data.tournament) throw new Error('Invalid backup: missing tournament');
  await saveTournamentLocal(data.tournament);
  for (const p of data.participants || []) {
    await saveParticipantLocal(p);
  }
  for (const m of data.matches || []) {
    await saveMatchLocal(m);
  }
}
