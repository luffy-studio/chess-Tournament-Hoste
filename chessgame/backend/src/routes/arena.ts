import express from 'express';
import { arenaManager } from '../arena/arenaManager';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

const createArenaGameSchema = z.object({
  creatorName: z.string().min(1, 'Creator name is required').max(50),
  creatorId: z.string().min(1, 'Creator ID is required').max(100),
  timeControl: z.object({
    initial: z.number().int().min(0).max(7200), // up to 2 hours
    increment: z.number().int().min(0).max(60), // up to 60s increment
  }),
  preferredColor: z.enum(['w', 'b', 'random']).optional(),
  socketId: z.string().optional(),
  roomId: z.string().optional(),
  tournamentId: z.string().optional(),
  matchId: z.string().optional(),
});

// List public active arena matches
router.get('/games', (req, res, next) => {
  try {
    const games = arenaManager.listPublicGames();
    res.json(games);
  } catch (error) {
    next(error);
  }
});

// Create or initialize an arena match
router.post('/games', validateBody(createArenaGameSchema), (req, res, next) => {
  try {
    const data = req.body;
    const result = arenaManager.createGame({
      roomId: data.roomId,
      creatorName: data.creatorName,
      creatorId: data.creatorId,
      timeControl: data.timeControl,
      preferredColor: data.preferredColor || 'random',
      socketId: data.socketId || 'pending',
      tournamentId: data.tournamentId,
      matchId: data.matchId,
    });

    res.status(201).json({
      roomId: result.game.id,
      playerColor: result.playerColor,
      gameState: arenaManager.getPublicGameState(result.game),
    });
  } catch (error) {
    next(error);
  }
});

// Get arena match details
router.get('/games/:roomId', (req, res, next) => {
  try {
    const game = arenaManager.getGame(req.params.roomId);
    if (!game) {
      throw new AppError('Game room not found', 404, 'NOT_FOUND');
    }
    res.json(arenaManager.getPublicGameState(game));
  } catch (error) {
    next(error);
  }
});

export default router;
