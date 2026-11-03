import { prisma, io } from '../index';
import { Participant, Match } from '@prisma/client';
import {
  generateSwissRound,
  generateRoundRobinPairings,
  computeAllTiebreaks,
  getStandingsComparator,
  generateAuditReport,
  PlayerHistory,
  buildPlayerHistory
} from 'tournament-engine';

export const BYE_ID = 'BYE';

/**
 * Computes standings, tie-breaks, and broadcasts the updated tournament state via WebSockets.
 */
export async function broadcastTournamentUpdate(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
        matches: {
          include: {
            white: true,
            black: true
          }
        }
      }
    });

    if (!tournament) return;

    // Convert participants to engine inputs
    const players = tournament.participants.map((p) => ({
      id: p.id,
      score: p.score,
      rating: p.rating
    }));

    // Convert matches to engine inputs
    const matchesInput = tournament.matches.map((m) => ({
      round: m.round,
      whiteId: m.whiteId,
      blackId: m.blackId,
      result: m.result as "W" | "L" | "D" | null
    }));

    // Compute tiebreaks
    const tiebreaksMap = computeAllTiebreaks(players, matchesInput, tournament.byePoints);
    const historyMap = buildPlayerHistory(players, matchesInput);

    // Compute standings ranking
    const comparator = getStandingsComparator(tiebreaksMap, matchesInput);
    const sortedParticipants = [...tournament.participants].sort((a, b) => comparator(a.id, b.id));

    // Map tiebreak metrics into the participant objects
    const standings = sortedParticipants.map((p, index) => {
      const tb = tiebreaksMap.get(p.id);
      return {
        ...p,
        rank: index + 1,
        buchholz: tb?.buchholz ?? 0,
        medianBuchholz: tb?.medianBuchholz ?? 0,
        cut1Buchholz: tb?.cut1Buchholz ?? 0,
        sonnebornBerger: tb?.sonnebornBerger ?? 0,
        progressiveScore: tb?.progressiveScore ?? 0,
        mostWins: tb?.mostWins ?? 0,
        mostWinsBlack: tb?.mostWinsBlack ?? 0,
        performanceRating: tb ? (tb.score > 0 ? p.rating : p.rating) : p.rating // Rp fallback
      };
    });

    // Compute Rp (rating performance)
    for (const st of standings) {
      const hist = historyMap.get(st.id);
      if (hist && hist.opponents.size > 0) {
        const opponentRatings = Array.from(hist.opponents).map((oppId) => {
          const opp = tournament.participants.find((p) => p.id === oppId);
          return opp ? opp.rating : 1200;
        });

        const tb = tiebreaksMap.get(st.id);
        const scoreForRp = tb ? tb.score : 0;

        // Perform FIDE Rp calculation
        const { calculatePerformanceRating } = require('tournament-engine');
        st.performanceRating = calculatePerformanceRating(st.rating, opponentRatings, scoreForRp);
      }
    }

    const payload = {
      ...tournament,
      participants: standings,
      matches: tournament.matches
    };

    io.to(`tournament:${tournamentId}`).emit('tournamentUpdated', payload);
    io.to(`tournament:${tournamentId}`).emit('standings:updated', { standings, tournamentId });
    return payload;
  } catch (error) {
    console.error(`Failed to broadcast tournament update for ${tournamentId}:`, error);
  }
}

/**
 * Generates Round Robin matches using the Berger Table algorithm.
 */
export async function generateRoundRobinMatches(tournamentId: string, playerIds: string[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
  });
  if (!tournament) return;

  const doubleRR = tournament.roundsPlanned > playerIds.length - 1;
  const pairings = generateRoundRobinPairings(playerIds, doubleRR);

  // Clear existing matches for safety
  await prisma.match.deleteMany({ where: { tournamentId } });

  // Create matches in DB
  for (const pair of pairings) {
    const isWhiteBye = pair.whiteId === null;
    const isBlackBye = pair.blackId === null;
    const isBye = isWhiteBye || isBlackBye;

    await prisma.match.create({
      data: {
        tournamentId,
        round: pair.round,
        board: pair.board,
        whiteId: pair.whiteId,
        blackId: pair.blackId,
        result: isBye ? (isBlackBye ? 'W' : 'L') : null,
        resultConfirmed: isBye,
        resultDetail: isBye ? 'BYE' : null,
        lastUpdatedBy: isBye ? 'System' : null,
        resultEnteredAt: isBye ? new Date() : null,
      }
    });
  }

  // Recalculate scores for BYE allocation
  await recalculateParticipantScores(tournamentId);

  // Create Audit Log
  await prisma.pairingAuditLog.create({
    data: {
      tournamentId,
      round: 1,
      action: 'PAIRINGS_GENERATED',
      details: JSON.stringify({
        mode: 'roundrobin',
        boardsCount: pairings.length,
        doubleRoundRobin: doubleRR
      })
    }
  });
}

/**
 * Generates Swiss pairings for the next round.
 */
export async function generateNextSwissRound(tournamentId: string, currentRound: number) {
  // Get active participants
  const participants = await prisma.participant.findMany({
    where: { tournamentId }
  });

  // Get all matches so far
  const matches = await prisma.match.findMany({
    where: { tournamentId }
  });

  const players = participants.map((p) => ({
    id: p.id,
    score: p.score,
    rating: p.rating
  }));

  const matchesInput = matches.map((m) => ({
    round: m.round,
    whiteId: m.whiteId,
    blackId: m.blackId,
    result: m.result as "W" | "L" | "D" | null
  }));

  // Generate pairing using Swiss Backtracking Engine
  const pairings = generateSwissRound(players, matchesInput);

  // Create matches in DB for the next round with sequential board numbers
  let currentBoardNumber = 1;
  const regularPairs = pairings.filter((p) => p.blackId !== null);
  const byePairs = pairings.filter((p) => p.blackId === null);

  for (const pair of regularPairs) {
    await prisma.match.create({
      data: {
        tournamentId,
        round: currentRound + 1,
        board: currentBoardNumber++,
        whiteId: pair.whiteId,
        blackId: pair.blackId,
        result: null
      }
    });
  }

  // BYE matches are automatically resolved and awarded
  for (const pair of byePairs) {
    await prisma.match.create({
      data: {
        tournamentId,
        round: currentRound + 1,
        board: currentBoardNumber++,
        whiteId: pair.whiteId,
        blackId: null,
        result: 'W',
        resultConfirmed: true,
        resultDetail: 'BYE',
        lastUpdatedBy: 'System',
        resultEnteredAt: new Date(),
      }
    });
  }

  // Update tournament current round
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { currentRound: currentRound + 1 }
  });

  // Automatically recalculate scores so BYE points are immediately reflected
  await recalculateParticipantScores(tournamentId);

  // Compile compliance report and store in Audit Log
  const historyMap = buildPlayerHistory(players, matchesInput);
  const tiebreaksMap = computeAllTiebreaks(players, matchesInput, 1.0);
  const auditReport = generateAuditReport(currentRound + 1, pairings, historyMap, tiebreaksMap);

  await prisma.pairingAuditLog.create({
    data: {
      tournamentId,
      round: currentRound + 1,
      action: 'PAIRINGS_GENERATED',
      details: JSON.stringify(auditReport)
    }
  });
}

/**
 * Recalculates total score for each participant in a tournament.
 */
export async function recalculateParticipantScores(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true, matches: true }
  });

  if (!tournament) return;

  const playerScores = new Map<string, number>();
  for (const p of tournament.participants) {
    playerScores.set(p.id, 0);
  }

  for (const m of tournament.matches) {
    // Bye handling
    if (m.whiteId && !m.blackId) {
      playerScores.set(m.whiteId, (playerScores.get(m.whiteId) || 0) + tournament.byePoints);
      continue;
    }
    if (m.blackId && !m.whiteId) {
      playerScores.set(m.blackId, (playerScores.get(m.blackId) || 0) + tournament.byePoints);
      continue;
    }

    // Normal matches
    if (m.whiteId && m.blackId && m.result) {
      if (m.result === 'W') {
        playerScores.set(m.whiteId, (playerScores.get(m.whiteId) || 0) + 1);
      } else if (m.result === 'L') {
        playerScores.set(m.blackId, (playerScores.get(m.blackId) || 0) + 1);
      } else if (m.result === 'D') {
        playerScores.set(m.whiteId, (playerScores.get(m.whiteId) || 0) + 0.5);
        playerScores.set(m.blackId, (playerScores.get(m.blackId) || 0) + 0.5);
      }
    }
  }

  // Update in DB
  for (const [pId, score] of playerScores.entries()) {
    await prisma.participant.update({
      where: { id: pId },
      data: { score }
    });
  }
}

