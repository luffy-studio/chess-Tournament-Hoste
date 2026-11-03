import express from 'express';
import { prisma } from '../index';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';

const router = express.Router();

// Require admin authentication for all webhook operations
router.use(authMiddleware, requireAdmin);

const createWebhookSchema = z.object({
  url: z.string().url('A valid HTTP/HTTPS URL is required'),
  secret: z.string().min(8, 'Secret must be at least 8 characters'),
  description: z.string().optional(),
  events: z.array(z.string()).min(1, 'At least one event subscription is required'),
});

// Get all endpoints (admin only)
router.get('/', async (req, res, next) => {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Mask secrets in response for security
    const masked = endpoints.map((ep) => ({
      ...ep,
      secret: `${ep.secret.slice(0, 4)}••••${ep.secret.slice(-4)}`,
    }));
    res.json(masked);
  } catch (error) {
    next(error);
  }
});

// Create endpoint (admin only)
router.post('/', validateBody(createWebhookSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url: data.url,
        secret: data.secret,
        description: data.description,
        events: data.events.join(','),
        active: true,
      },
    });
    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
});

// Get logs for endpoint (admin only)
router.get('/:id/logs', async (req, res, next) => {
  try {
    const logs = await prisma.webhookEvent.findMany({
      where: { endpointId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// Delete endpoint (admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.webhookEndpoint.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Webhook endpoint removed.' });
  } catch (error) {
    next(error);
  }
});

export default router;
