import express from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { z } from 'zod';
import { dispatchWebhook } from '../services/webhookService';
import { generateRoundRobinMatches, generateNextSwissRound, broadcastTournamentUpdate } from '../utils/tournamentUtils';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Get all tournaments (public)
router.get('/', async (req, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        participants: { select: { id: true, name: true, score: true } },
      },
    });
    res.json(tournaments);
  } catch (error) {
    next(error);
  }
});

// Create tournament (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  const schema = z.object({
    name: z.string().min(1, 'Tournament name is required').max(100),
    mode: z.enum(['swiss', 'roundrobin']),
    roundsPlanned: z.number().int().min(1).max(50),
    byePoints: z.number().min(0).max(1),
  });

  try {
    const data = schema.parse(req.body);
    const tournament = await prisma.tournament.create({
      data,
    });

    // Dispatch webhook
    await dispatchWebhook('tournament.created', tournament);

    // Emit structured event
    io.to('global').emit('tournament:created', tournament);

    res.status(201).json(tournament);
  } catch (error) {
    next(error);
  }
});

// Get single tournament details (public)
router.get('/:id', async (req, res, next) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          orderBy: { score: 'desc' },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { board: 'asc' }],
        },
        settings: true,
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!tournament) throw new AppError('Tournament not found', 404, 'NOT_FOUND');
    res.json(tournament);
  } catch (error) {
    next(error);
  }
});

// Update tournament metadata (admin only)
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    venue: z.string().optional(),
    timeControl: z.string().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: { name: data.name },
    });

    // Update settings if venue/timeControl/description provided
    if (data.venue !== undefined || data.timeControl !== undefined || data.description !== undefined) {
      await prisma.tournamentSettings.upsert({
        where: { tournamentId: req.params.id },
        create: {
          tournamentId: req.params.id,
          venue: data.venue,
          timeControl: data.timeControl,
          description: data.description,
        },
        update: {
          venue: data.venue,
          timeControl: data.timeControl,
          description: data.description,
        },
      });
    }

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update tournament', details: error });
  }
});

// Delete tournament (admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.tournament.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Tournament not found', 404, 'NOT_FOUND');
    }
    await prisma.tournament.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Tournament "${existing.name}" deleted.` });
  } catch (error) {
    next(error);
  }
});

// Complete tournament (admin only)
router.patch('/:id/complete', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
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

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.status === 'completed') {
      return res.status(400).json({ error: 'Tournament is already completed' });
    }

    // Check for pending matches in ongoing tournament
    const pendingMatches = tournament.matches.filter((m) => m.result === null);
    if (pendingMatches.length > 0) {
      return res.status(400).json({
        error: `Cannot complete tournament: ${pendingMatches.length} match(es) still have unsubmitted results.`,
        pendingMatches: pendingMatches.map((m) => ({ round: m.round, board: m.board })),
      });
    }

    // Ensure all scores and tiebreaks are finalized
    const { recalculateParticipantScores } = require('../utils/tournamentUtils');
    await recalculateParticipantScores(tournament.id);

    const updatedPayload = await broadcastTournamentUpdate(tournament.id);
    const standings = updatedPayload?.participants || [];

    // Determine Official Winner / Co-Champions
    let winner = null;
    let coChampions: any[] = [];
    let isTied = false;

    if (standings.length > 0) {
      const top = standings[0];
      // Check for unbreakable tie for 1st place across ALL tiebreaks
      const tiedWithTop = standings.filter(
        (s: any) =>
          s.score === top.score &&
          s.buchholz === top.buchholz &&
          s.sonnebornBerger === top.sonnebornBerger &&
          s.cut1Buchholz === top.cut1Buchholz &&
          s.mostWins === top.mostWins &&
          s.mostWinsBlack === top.mostWinsBlack
      );

      if (tiedWithTop.length > 1) {
        isTied = true;
        coChampions = tiedWithTop;
        winner = top;
      } else {
        winner = top;
      }
    }

    const championDetails = JSON.stringify({
      winner,
      isTied,
      coChampions,
      top3: standings.slice(0, 3),
      completedAt: new Date().toISOString(),
    });

    const updatedTournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        winnerId: winner?.id || null,
        winnerName: isTied ? coChampions.map((c: any) => c.name).join(' & ') : (winner?.name || null),
        championDetails,
      },
      include: {
        participants: true,
        matches: true,
      }
    });

    io.to(`tournament:${req.params.id}`).emit('tournament:completed', {
      tournament: updatedTournament,
      winner,
      isTied,
      coChampions,
    });
    await broadcastTournamentUpdate(req.params.id);

    res.json(updatedTournament);
  } catch (error) {
    console.error('Failed to complete tournament:', error);
    res.status(500).json({ error: 'Failed to complete tournament' });
  }
});

// Pause tournament (admin only)
router.patch('/:id/pause', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: { status: 'paused' },
    });

    io.to(`tournament:${req.params.id}`).emit('tournament:paused', tournament);
    await broadcastTournamentUpdate(req.params.id);

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pause tournament' });
  }
});

// Start tournament (admin only)
router.post('/:id/start', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: true }
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.status !== 'setup') return res.status(400).json({ error: `Tournament already started (status: ${tournament.status})` });
    if (tournament.participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants are required to start a tournament' });
    }

    if (tournament.mode === 'roundrobin') {
      await generateRoundRobinMatches(tournament.id, tournament.participants.map(p => p.id));
    } else {
      await generateNextSwissRound(tournament.id, 0); // Generates round 1
    }

    const updated = await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'ongoing', currentRound: 1 },
    });

    // Create TournamentSettings if not exists
    await prisma.tournamentSettings.upsert({
      where: { tournamentId: tournament.id },
      create: { tournamentId: tournament.id },
      update: {},
    });

    await dispatchWebhook('tournament.started', updated);
    await broadcastTournamentUpdate(tournament.id);

    io.to(`tournament:${tournament.id}`).emit('tournament:started', updated);

    res.json(updated);
  } catch (error) {
    console.error('Failed to start tournament:', error);
    res.status(500).json({ error: 'Failed to start tournament' });
  }
});

// Next Round (admin only)
router.post('/:id/next-round', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { matches: true },
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.mode !== 'swiss') return res.status(400).json({ error: 'Only Swiss tournaments support round-by-round generation' });
    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ error: `Cannot generate next round when tournament is '${tournament.status}'. Must be 'ongoing'.` });
    }

    if (tournament.currentRound >= tournament.roundsPlanned) {
      return res.status(400).json({
        error: `All planned rounds (${tournament.roundsPlanned}) have already been completed. Finalize tournament to declare winners.`,
      });
    }

    // Check if any matches in current round are pending
    const pendingMatches = tournament.matches.filter(
      (m) => m.round === tournament.currentRound && m.result === null
    );

    if (pendingMatches.length > 0) {
      return res.status(400).json({
        error: `Cannot start next round: Round ${tournament.currentRound} has ${pendingMatches.length} pending match(es) awaiting results.`,
        pendingBoards: pendingMatches.map((m) => m.board),
      });
    }

    await generateNextSwissRound(tournament.id, tournament.currentRound);
    await broadcastTournamentUpdate(tournament.id);

    const updated = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: { matches: true, participants: true }
    });

    io.to(`tournament:${tournament.id}`).emit('round:generated', { tournamentId: tournament.id, round: tournament.currentRound + 1 });

    res.json(updated);
  } catch (error) {
    console.error('Failed to generate next round:', error);
    res.status(500).json({ error: 'Failed to generate next round' });
  }
});

// Get announcements (public)
router.get('/:id/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { tournamentId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Post announcement (admin only)
router.post('/:id/announcements', authMiddleware, requireAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const announcement = await prisma.announcement.create({
      data: {
        tournamentId: req.params.id,
        message,
        postedBy: req.user?.username || 'admin',
      },
    });

    io.to(`tournament:${req.params.id}`).emit('announcement:posted', announcement);

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// Export tournament snapshot (public)
router.get('/:id/export', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        participants: true,
        matches: true,
        rounds: true,
        announcements: true,
        settings: true,
      },
    });
    if (!tournament) return res.status(404).json({ error: 'Not found' });
    res.json({ exportedAt: new Date().toISOString(), tournament });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export tournament' });
  }
});

// Pairing Preview (public)
router.get('/:id/pairings/preview', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: true, matches: true }
    });
    if (!tournament) return res.status(404).json({ error: 'Not found' });

    if (tournament.mode !== 'swiss') {
      return res.status(400).json({ error: 'Pairing preview only available for Swiss format.' });
    }

    const { generateSwissRound, buildPlayerHistory, computeAllTiebreaks, generateAuditReport } = require('tournament-engine');

    const players = tournament.participants.map(p => ({
      id: p.id,
      score: p.score,
      rating: p.rating
    }));

    const matchesInput = tournament.matches.map(m => ({
      round: m.round,
      whiteId: m.whiteId,
      blackId: m.blackId,
      result: m.result as any
    }));

    const nextPairings = generateSwissRound(players, matchesInput);
    const historyMap = buildPlayerHistory(players, matchesInput);
    const tiebreaksMap = computeAllTiebreaks(players, matchesInput, tournament.byePoints);
    const auditReport = generateAuditReport(tournament.currentRound + 1, nextPairings, historyMap, tiebreaksMap);

    res.json({ pairings: nextPairings, auditReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate pairings preview' });
  }
});

// Pairing Simulation (admin only)
router.post('/:id/pairings/simulate', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: true, matches: true }
    });
    if (!tournament) return res.status(404).json({ error: 'Not found' });

    const { generateSwissRound, generateRoundRobinPairings, computeAllTiebreaks, getStandingsComparator } = require('tournament-engine');

    let simPlayers = tournament.participants.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rating: p.rating
    }));

    let simMatches = tournament.matches.map(m => ({
      round: m.round,
      whiteId: m.whiteId,
      blackId: m.blackId,
      result: m.result as any
    }));

    let simRound = tournament.currentRound;
    const totalRounds = tournament.roundsPlanned;

    while (simRound < totalRounds) {
      simRound++;

      let roundPairings: any[] = [];
      if (tournament.mode === 'swiss') {
        roundPairings = generateSwissRound(simPlayers, simMatches);
      } else {
        const rrPairings = generateRoundRobinPairings(simPlayers.map(p => p.id), totalRounds > simPlayers.length - 1);
        roundPairings = rrPairings.filter((p: any) => p.round === simRound);
      }

      for (const pair of roundPairings) {
        let result: 'W' | 'L' | 'D' = 'D';

        if (pair.whiteId && pair.blackId) {
          const w = simPlayers.find(p => p.id === pair.whiteId)!;
          const b = simPlayers.find(p => p.id === pair.blackId)!;

          const diff = w.rating - b.rating;
          const probWhiteWin = 0.4 + (diff / 800);
          const rand = Math.random();

          if (rand < probWhiteWin) {
            result = 'W';
            w.score += 1;
          } else if (rand > probWhiteWin + 0.2) {
            result = 'L';
            b.score += 1;
          } else {
            result = 'D';
            w.score += 0.5;
            b.score += 0.5;
          }
        } else if (pair.whiteId) {
          const w = simPlayers.find(p => p.id === pair.whiteId)!;
          w.score += tournament.byePoints;
          result = 'W';
        }

        simMatches.push({
          round: simRound,
          whiteId: pair.whiteId,
          blackId: pair.blackId,
          result: result
        });
      }
    }

    const tiebreaksMap = computeAllTiebreaks(simPlayers, simMatches, tournament.byePoints);
    const comparator = getStandingsComparator(tiebreaksMap, simMatches);
    simPlayers.sort((a, b) => comparator(a.id, b.id));

    const finalStandings = simPlayers.map((p, index) => {
      const tb = tiebreaksMap.get(p.id);
      return {
        ...p,
        rank: index + 1,
        buchholz: tb?.buchholz ?? 0,
        sonnebornBerger: tb?.sonnebornBerger ?? 0,
        progressiveScore: tb?.progressiveScore ?? 0,
        mostWins: tb?.mostWins ?? 0
      };
    });

    res.json({ standings: finalStandings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to run pairing simulation' });
  }
});

// Get Audit Report for Round (public)
router.get('/:id/audits/:round', async (req, res) => {
  try {
    const round = parseInt(req.params.round, 10);
    const auditLog = await prisma.pairingAuditLog.findFirst({
      where: {
        tournamentId: req.params.id,
        round
      },
      orderBy: { createdAt: 'desc' }
    });
    if (!auditLog) return res.status(404).json({ error: 'No audit report found for this round' });

    let auditData: any;
    try {
      auditData = JSON.parse(auditLog.details);
    } catch {
      return res.json({ raw: auditLog.details });
    }

    // Enrich with participant names so audits show real player names instead of UUIDs
    const participants = await prisma.participant.findMany({
      where: { tournamentId: req.params.id },
      select: { id: true, name: true }
    });
    const playerMap = new Map<string, string>(participants.map(p => [p.id, p.name]));

    if (auditData?.pairingAuditReport?.floaters && Array.isArray(auditData.pairingAuditReport.floaters)) {
      auditData.pairingAuditReport.floaters = auditData.pairingAuditReport.floaters.map((f: any) => ({
        ...f,
        playerName: playerMap.get(f.playerId) || f.playerId
      }));
    }

    if (auditData?.colorBalanceReport && Array.isArray(auditData.colorBalanceReport)) {
      auditData.colorBalanceReport = auditData.colorBalanceReport.map((c: any) => ({
        ...c,
        playerName: playerMap.get(c.playerId) || c.playerId
      }));
    }

    if (auditData?.tiebreakCalculationReport && Array.isArray(auditData.tiebreakCalculationReport)) {
      auditData.tiebreakCalculationReport = auditData.tiebreakCalculationReport.map((t: any) => ({
        ...t,
        playerName: playerMap.get(t.playerId) || t.playerId
      }));
    }

    if (auditData?.fideComplianceReport?.checklist && Array.isArray(auditData.fideComplianceReport.checklist)) {
      auditData.fideComplianceReport.checklist = auditData.fideComplianceReport.checklist.map((item: any) => {
        let details = item.details || '';
        for (const [id, name] of playerMap.entries()) {
          if (details.includes(id)) {
            details = details.split(id).join(name);
          }
        }
        return { ...item, details };
      });
    }

    res.json(auditData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit report' });
  }
});

// Get all Audit Logs (public)
router.get('/:id/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.pairingAuditLog.findMany({
      where: { tournamentId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Export full tournament JSON snapshot (public)
router.get('/:id/export', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        participants: true,
        matches: true,
        rounds: true,
        settings: true,
        announcements: true,
      },
    });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export tournament' });
  }
});

export default router;
