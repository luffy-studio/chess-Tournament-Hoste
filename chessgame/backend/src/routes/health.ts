import express from 'express';
import { prisma } from '../index';
import os from 'os';

const router = express.Router();

/**
 * Detailed Health Check Endpoint.
 * Verifies application uptime, system metrics, and database connectivity.
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;

  try {
    // Check DB availability via query
    await prisma.$queryRawUnsafe('SELECT 1');
    dbLatencyMs = Date.now() - startTime;
    dbStatus = 'healthy';
  } catch (error: any) {
    dbStatus = 'error';
    console.error('Database health check failed:', error.message);
  }

  const memoryUsage = process.memoryUsage();
  const isHealthy = dbStatus === 'healthy';

  const healthData = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'royal-chess-championship-backend',
    version: '2.2.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      nodeMemoryUsageMB: {
        rss: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsed: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotal: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
      },
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
    },
  };

  res.status(isHealthy ? 200 : 503).json(healthData);
});

/**
 * Liveness probe: returns 200 as long as the process is running.
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe: checks if database is connected and ready to accept traffic.
 */
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: 'Database unavailable' });
  }
});

export default router;
