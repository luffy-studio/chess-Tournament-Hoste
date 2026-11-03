import { useState } from 'react';
import {
  saveTournamentLocal,
  getTournamentLocal,
  getAllTournamentsLocal,
  saveParticipantLocal,
  getParticipantsLocal,
  saveMatchLocal,
  getMatchesLocal,
} from '../storage/db';

const ACTIVE_TOURNAMENT_KEY = 'chess_active_tournament_id';

export function useStandaloneStorage() {
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_TOURNAMENT_KEY)
  );

  const saveActiveId = (id: string | null) => {
    setActiveTournamentId(id);
    if (id) {
      localStorage.setItem(ACTIVE_TOURNAMENT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_TOURNAMENT_KEY);
    }
  };

  return {
    activeTournamentId,
    setActiveTournamentId: saveActiveId,
    // Persistence helpers
    saveTournament: saveTournamentLocal,
    getTournament: getTournamentLocal,
    getAllTournaments: getAllTournamentsLocal,
    saveParticipant: saveParticipantLocal,
    getParticipants: getParticipantsLocal,
    saveMatch: saveMatchLocal,
    getMatches: getMatchesLocal,
  };
}
