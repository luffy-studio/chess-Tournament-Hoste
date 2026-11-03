import express from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { z } from 'zod';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { dispatchWebhook } from '../services/webhookService';
import { broadcastTournamentUpdate } from '../utils/tournamentUtils';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';
import { AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';

const router = express.Router({ mergeParams: true }); // to access :tournamentId from parent

// Multer setup: store CSV in memory with 5MB max file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const participantSchema = z.object({
  name: z.string().min(1, 'Participant name is required').max(100),
  rating: z.number().int().min(100).max(3500).default(1200),
  nationalRating: z.number().int().min(100).max(3500).nullable().optional(),
  isUnrated: z.boolean().default(true),
  title: z.string().max(10).nullable().optional(),
});

const participantUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rating: z.number().int().min(100).max(3500).optional(),
  nationalRating: z.number().int().min(100).max(3500).nullable().optional(),
  isUnrated: z.boolean().optional(),
  title: z.string().max(10).nullable().optional(),
});

// Get participants (public)
router.get('/', async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const participants = await prisma.participant.findMany({
      where: { tournamentId },
      orderBy: { score: 'desc' },
    });
    res.json(participants);
  } catch (error) {
    next(error);
  }
});

// Add participant (admin only)
router.post('/', authMiddleware, requireAdmin, validateBody(participantSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const tournamentId = (req.params as any).tournamentId as string;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { settings: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
    }

    if (tournament.status === 'completed') {
      throw new AppError('Cannot add participants to a completed tournament', 400, 'TOURNAMENT_COMPLETED');
    }

    // Check max participants limit if configured
    if (tournament.settings?.maxParticipants) {
      const currentCount = await prisma.participant.count({ where: { tournamentId } });
      if (currentCount >= tournament.settings.maxParticipants) {
        throw new AppError(`Maximum participant capacity (${tournament.settings.maxParticipants}) reached`, 400, 'CAPACITY_REACHED');
      }
    }

    const participant = await prisma.participant.create({
      data: {
        name: data.name.trim(),
        rating: data.rating,
        nationalRating: data.nationalRating,
        isUnrated: data.isUnrated,
        title: data.title ? data.title.trim() : null,
        tournamentId,
      },
    });

    await dispatchWebhook('player.registered', participant);
    await broadcastTournamentUpdate(tournamentId);

    io.to(`tournament:${tournamentId}`).emit('participant:registered', participant);

    res.status(201).json(participant);
  } catch (error) {
    next(error);
  }
});

// Import participants via CSV (admin only)
router.post('/import', authMiddleware, requireAdmin, upload.single('file'), async (req, res, next) => {
  const tournamentId = (req.params as any).tournamentId as string;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please upload a valid CSV file.' });
  }

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      throw new AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
    }

    if (tournament.status === 'completed') {
      throw new AppError('Cannot import participants into a completed tournament', 400, 'TOURNAMENT_COMPLETED');
    }

    const csvBuffer = req.file.buffer;

    // Parse CSV
    const records: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(csvBuffer);
      stream
        .pipe(
          parse({
            columns: true,
            trim: true,
            skip_empty_lines: true,
          })
        )
        .on('data', (row: any) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const row of records) {
        const name = row.name?.trim();
        if (!name) {
          skipped++;
          errors.push(`Skipped row: missing name`);
          continue;
        }

        const rating = row.rating ? parseInt(row.rating, 10) : 1200;
        const nationalRating = row.nationalRating ? parseInt(row.nationalRating, 10) : null;
        const title = row.title?.trim() || null;

        try {
          const participant = await tx.participant.create({
            data: {
              name,
              rating: isNaN(rating) ? 1200 : rating,
              nationalRating: nationalRating && !isNaN(nationalRating) ? nationalRating : null,
              title,
              isUnrated: !row.rating,
              tournamentId,
            },
          });

          io.to(`tournament:${tournamentId}`).emit('participant:registered', participant);
          imported++;
        } catch (err: any) {
          skipped++;
          errors.push(`Skipped "${name}": ${err.message || 'duplicate or invalid'}`);
        }
      }
    });

    await broadcastTournamentUpdate(tournamentId);

    res.json({ imported, skipped, errors });
  } catch (error) {
    next(error);
  }
});

// Update participant details (admin only - IDOR protected)
router.put('/:id', authMiddleware, requireAdmin, validateBody(participantUpdateSchema), async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const participantId = req.params.id;

    // Verify participant belongs to this tournament (IDOR protection)
    const existing = await prisma.participant.findFirst({
      where: { id: participantId, tournamentId },
    });

    if (!existing) {
      throw new AppError('Participant not found in this tournament', 404, 'NOT_FOUND');
    }

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: req.body,
    });

    await broadcastTournamentUpdate(tournamentId);
    io.to(`tournament:${tournamentId}`).emit('participant:updated', participant);

    res.json(participant);
  } catch (error) {
    next(error);
  }
});

// Remove participant (admin only - IDOR protected)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const tournamentId = (req.params as any).tournamentId as string;
    const participantId = req.params.id;

    // Verify participant belongs to this tournament (IDOR protection)
    const existing = await prisma.participant.findFirst({
      where: { id: participantId, tournamentId },
    });

    if (!existing) {
      throw new AppError('Participant not found in this tournament', 404, 'NOT_FOUND');
    }

    const participant = await prisma.participant.delete({
      where: { id: participantId },
    });

    await dispatchWebhook('player.removed', participant);
    await broadcastTournamentUpdate(tournamentId);

    io.to(`tournament:${tournamentId}`).emit('participant:removed', { id: participantId, tournamentId });

    res.json({ success: true, message: `Participant "${existing.name}" removed.` });
  } catch (error) {
    next(error);
  }
});

export default router;
