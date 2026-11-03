import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import os from 'os';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import tournamentRoutes from './routes/tournaments';
import participantRoutes from './routes/participants';
import matchRoutes from './routes/matches';
import webhookRoutes from './routes/webhooks';
import systemRoutes from './routes/system';
import arenaRoutes from './routes/arena';
import healthRoutes from './routes/health';
import { arenaManager } from './arena/arenaManager';

import { requestLogger } from './middleware/requestLogger';
import { sanitizeMiddleware } from './middleware/validate';
import { errorHandler, AppError } from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Prisma singleton
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Validates whether an incoming HTTP or WebSocket origin is authorized.
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // allow same-origin, curl, server-to-server, mobile

  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;
  // If not configured, empty, or wildcard '*', permit all origins
  if (!rawOrigins || rawOrigins.trim() === '' || rawOrigins.trim() === '*') {
    return true;
  }

  const allowedList = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedList.includes(origin) || allowedList.includes('*')) {
    return true;
  }

  try {
    const url = new URL(origin);
    const host = url.hostname;

    // Automatically allow all Vercel domains (*.vercel.app)
    if (host.endsWith('.vercel.app') || host === 'vercel.app') {
      return true;
    }

    // In development or local LAN mode, allow localhost and private RFC-1918 subnets
    const isDevOrLan = process.env.NODE_ENV !== 'production' || process.env.ALLOW_LAN_CORS === 'true';
    if (isDevOrLan) {
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

// Socket.IO configuration with origin verification and heartbeat settings
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not permitted by Socket.IO CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Managed by reverse proxy or client bundle
  })
);

// Structured request logging with correlation ID
app.use(requestLogger);

// CORS with origin validation and automatic Vercel/LAN support
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// JSON parser with size limit to prevent payload flooding
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization against XSS vectors
app.use(sanitizeMiddleware);

// Rate Limiting handlers
const rateLimitHandler = (req: express.Request, res: express.Response) => {
  res.status(429).json({
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You have exceeded the allowed request frequency. Please wait before retrying.',
    requestId: (req as any).id,
  });
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use(generalLimiter);

// Sensitive Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/auth', authLimiter);

// Socket.IO JWT validation middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = decoded;
    } catch {
      // Allow unauthenticated spectator sockets for public scoreboard
    }
  }
  next();
});

// Connect Arena Manager to Socket.IO
arenaManager.setIO(io);

// Socket.IO room events
io.on('connection', (socket) => {
  socket.on('joinTournament', (tournamentId) => {
    socket.join(`tournament:${tournamentId}`);
  });

  socket.on('joinGlobal', () => {
    socket.join('global');
  });

  socket.on('leaveTournament', (tournamentId) => {
    socket.leave(`tournament:${tournamentId}`);
  });

  // Arena events
  socket.on('arena:join', ({ roomId, player }) => {
    socket.join(`arena:${roomId}`);
    const result = arenaManager.joinGame(roomId, {
      id: player.id,
      name: player.name,
      socketId: socket.id,
    });
    if (result) {
      socket.emit('arena:gameState', {
        role: result.role,
        game: arenaManager.getPublicGameState(result.game),
      });
      io.to(`arena:${roomId}`).emit('arena:playerJoined', {
        role: result.role,
        player,
        game: arenaManager.getPublicGameState(result.game),
      });
    } else {
      socket.emit('arena:error', { message: 'Game room not found' });
    }
  });

  socket.on('arena:move', ({ roomId, playerId, move }) => {
    const outcome = arenaManager.makeMove(roomId, playerId, move);
    if (!outcome.success) {
      socket.emit('arena:error', { message: outcome.error });
    }
  });

  socket.on('arena:resign', ({ roomId, playerId }) => {
    const outcome = arenaManager.resign(roomId, playerId);
    if (!outcome.success) {
      socket.emit('arena:error', { message: outcome.error });
    }
  });

  socket.on('arena:drawOffer', ({ roomId, playerId }) => {
    const outcome = arenaManager.offerDraw(roomId, playerId);
    if (!outcome.success) {
      socket.emit('arena:error', { message: outcome.error });
    }
  });

  socket.on('arena:drawResponse', ({ roomId, playerId, accept }) => {
    const outcome = arenaManager.respondDraw(roomId, playerId, accept);
    if (!outcome.success) {
      socket.emit('arena:error', { message: outcome.error });
    }
  });

  socket.on('disconnect', () => {
    arenaManager.handleDisconnect(socket.id);
  });
});

// Helper to get local LAN IP
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// System info endpoint
app.get('/api/system/info', (req, res) => {
  const ip = getLocalIP();
  res.json({
    version: '2.2.0',
    mode: 'lan',
    localIP: ip,
    localIp: ip,
    port: Number(process.env.PORT || 5000),
  });
});

// Welcome / Root Status endpoints
const apiStatusHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'online',
    name: 'Grandmaster Suite API',
    version: '2.2.0',
    platform: 'Production Cloud / LAN Hybrid',
    creator: 'Sarvagya Sharma',
    endpoints: {
      health: '/api/health',
      tournaments: '/api/tournaments',
      auth: '/api/auth',
      arena: '/api/arena',
      system: '/api/system/info',
    },
  });
};

app.get('/', apiStatusHandler);
app.get('/api', apiStatusHandler);

// Mount Primary Routes under /api
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/tournaments/:tournamentId/participants', participantRoutes);
app.use('/api/tournaments/:tournamentId/matches', matchRoutes);
app.use('/api/arena', arenaRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/system', systemRoutes);

// Root route aliases (permits clients to query /tournaments, /auth without /api prefix)
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/tournaments', tournamentRoutes);
app.use('/tournaments/:tournamentId/participants', participantRoutes);
app.use('/tournaments/:tournamentId/matches', matchRoutes);
app.use('/arena', arenaRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/system', systemRoutes);

// 404 Route Catch-all
app.use((req, res, next) => {
  next(new AppError(`Endpoint ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
});

// Centralized Error Handler (must be mounted last)
app.use(errorHandler);

// Start Server — bind to 0.0.0.0 for LAN and cloud hosting
const PORT = process.env.PORT || 5000;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (LAN accessible at ${getLocalIP()}:${PORT})`);
});

// Graceful Shutdown on termination signals
async function gracefulShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Initiating graceful termination...`);

  httpServer.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed. No longer accepting new connections.');

    io.close(() => {
      console.log('[SHUTDOWN] Socket.IO server closed.');
    });

    try {
      await prisma.$disconnect();
      console.log('[SHUTDOWN] Prisma database client disconnected cleanly.');
    } catch (err: any) {
      console.error('[SHUTDOWN] Error during database disconnect:', err.message);
    }

    console.log('[SHUTDOWN] All services stopped cleanly. Exiting.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SHUTDOWN] Forceful termination triggered after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io, prisma };
