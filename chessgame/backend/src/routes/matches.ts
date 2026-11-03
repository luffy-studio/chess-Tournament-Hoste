import express from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { z } from 'zod';
import { dispatchWebhook } from '../services/webhookService';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';

const router = express.Router({ mergeParams: true }); // to access :tournamentId

const updateMatchSchema = z.object({
  result: z.enum(['W', 'L', 'D']).nullable(),
});

const bulkMatchesSchema = z.object({
  matches: z.array(
    z.object({
      board: z.number().int().min(1),
      round: z.number().int().min(1),
      whiteId: z.string().nullable(),
      blackId: z.string().nullable(),
    })
  ).min(1, 'At least one match is required'),
});

// Get matches for tournament (public)
router.get('/', async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      include: {
        white: true,
        black: true,
      },
      orderBy: [{ round: 'asc' }, { board: 'asc' }],
    });
    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// Bulk update / manual override for matches in a round (admin only)
router.put('/bulk', authMiddleware, requireAdmin, validateBody(bulkMatchesSchema), async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const { matches } = req.body;

    const round = matches[0]?.round;
    if (!round) throw new AppError('No matches provided', 400);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true, matches: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
    }

    // 1. Delete matches in the specified round for this tournament only
    await prisma.match.deleteMany({
      where: { tournamentId, round },
    });

    // 2. Insert the manually specified matches
    for (const m of matches) {
      await prisma.match.create({
        data: {
          tournamentId,
          round: m.round,
          board: m.board,
          whiteId: m.whiteId,
          blackId: m.blackId,
          result: null,
          isManual: true,
        },
      });
    }

    // 3. Recalculate scores and broadcast
    const { recalculateParticipantScores, broadcastTournamentUpdate } = require('../utils/tournamentUtils');
    await recalculateParticipantScores(tournamentId);
    await broadcastTournamentUpdate(tournamentId);

    // 4. Create Audit Log for manual override
    const { generateAuditReport, buildPlayerHistory, computeAllTiebreaks } = require('tournament-engine');
    const players = tournament.participants.map((p) => ({ id: p.id, score: p.score, rating: p.rating }));
    const matchesInput = tournament.matches.map((mt) => ({
      round: mt.round,
      whiteId: mt.whiteId,
      blackId: mt.blackId,
      result: mt.result as any,
    }));
    const historyMap = buildPlayerHistory(players, matchesInput);
    const tiebreaksMap = computeAllTiebreaks(players, matchesInput, tournament.byePoints);

    const pairingsToAudit = matches.map((mt: any) => ({
      whiteId: mt.whiteId,
      blackId: mt.blackId,
      board: mt.board,
      whiteScore: tournament.participants.find((p) => p.id === mt.whiteId)?.score,
      blackScore: tournament.participants.find((p) => p.id === mt.blackId)?.score,
      whiteRating: tournament.participants.find((p) => p.id === mt.whiteId)?.rating,
      blackRating: tournament.participants.find((p) => p.id === mt.blackId)?.rating,
    }));

    const auditReport = generateAuditReport(round, pairingsToAudit, historyMap, tiebreaksMap);

    await prisma.pairingAuditLog.create({
      data: {
        tournamentId,
        round,
        action: 'MANUAL_OVERRIDE',
        details: JSON.stringify(auditReport),
      },
    });

    res.json({ success: true, message: `Successfully updated ${matches.length} boards for Round ${round}` });
  } catch (error) {
    next(error);
  }
});

// Update match result (admin only - IDOR protected)
router.put('/:id', authMiddleware, requireAdmin, validateBody(updateMatchSchema), async (req, res, next) => {
  try {
    const { result } = req.body;
    const tournamentId = (req.params as any).tournamentId as string;
    const matchId = req.params.id;
    const actorUsername = req.user?.username || 'admin';

    // Verify match belongs to this tournament (IDOR protection)
    const existingMatch = await prisma.match.findFirst({
      where: { id: matchId, tournamentId },
    });

    if (!existingMatch) {
      throw new AppError('Match not found in this tournament', 404, 'NOT_FOUND');
    }

    const previousResult = existingMatch.result;
    const action = previousResult ? 'RESULT_CORRECTED' : 'RESULT_SUBMITTED';

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        result,
        lastUpdatedBy: actorUsername,
        resultEnteredAt: new Date(),
      },
    });

    // Create audit log
    await prisma.matchAuditLog.create({
      data: {
        matchId: match.id,
        tournamentId,
        action,
        previousResult,
        newResult: result,
        actorUsername,
      },
    });

    await dispatchWebhook('result.submitted', match);

    // Recalculate participant scores and broadcast update
    const { recalculateParticipantScores, broadcastTournamentUpdate } = require('../utils/tournamentUtils');
    await recalculateParticipantScores(tournamentId);
    const payload = await broadcastTournamentUpdate(tournamentId);

    // Emit structured events
    const eventName = action === 'RESULT_CORRECTED' ? 'result:corrected' : 'result:submitted';
    io.to(`tournament:${tournamentId}`).emit(eventName, { match, actorUsername });

    if (payload) {
      io.to(`tournament:${tournamentId}`).emit('standings:updated', {
        standings: (payload as any).participants,
        tournamentId,
      });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Confirm match result (admin only - IDOR protected)
router.patch('/:id/confirm', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const matchId = req.params.id;
    const actorUsername = req.user?.username || 'admin';

    // Verify match belongs to this tournament (IDOR protection)
    const existingMatch = await prisma.match.findFirst({
      where: { id: matchId, tournamentId },
    });

    if (!existingMatch) {
      throw new AppError('Match not found in this tournament', 404, 'NOT_FOUND');
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: { resultConfirmed: true },
    });

    await prisma.matchAuditLog.create({
      data: {
        matchId: match.id,
        tournamentId,
        action: 'RESULT_CONFIRMED',
        previousResult: match.result,
        newResult: match.result,
        actorUsername,
      },
    });

    io.to(`tournament:${tournamentId}`).emit('result:confirmed', { match, actorUsername });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Get audit log for a match (public)
router.get('/:id/audit', async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const matchId = req.params.id;

    const auditLogs = await prisma.matchAuditLog.findMany({
      where: { matchId, tournamentId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(auditLogs);
  } catch (error) {
    next(error);
  }
});

// Reopen a round: delete all unconfirmed results and reset round status (admin only)
router.post('/:round/reopen', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const round = parseInt(req.params.round, 10);

    if (isNaN(round) || round < 1) {
      throw new AppError('Invalid round number', 400, 'INVALID_ROUND');
    }

    // Get unconfirmed matches for this round
    const unconfirmedMatches = await prisma.match.findMany({
      where: { tournamentId, round, resultConfirmed: false },
    });

    // Clear results on unconfirmed matches
    await prisma.match.updateMany({
      where: { tournamentId, round, resultConfirmed: false },
      data: { result: null, resultEnteredAt: null, lastUpdatedBy: null },
    });

    // Reset round status if exists
    await prisma.round.updateMany({
      where: { tournamentId, roundNumber: round },
      data: { status: 'active', completedAt: null },
    });

    const { recalculateParticipantScores, broadcastTournamentUpdate } = require('../utils/tournamentUtils');
    await recalculateParticipantScores(tournamentId);
    await broadcastTournamentUpdate(tournamentId);

    res.json({ success: true, matchesReopened: unconfirmedMatches.length });
  } catch (error) {
    next(error);
  }
});

export default router;
