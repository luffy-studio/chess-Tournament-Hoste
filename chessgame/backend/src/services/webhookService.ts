import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../index';

/**
 * Dispatches a webhook event. If it fails, schedules a retry.
 * For simplicity, we are handling retries via a recursive setTimeout or immediate DB polling in a real system.
 * Here, we'll demonstrate a basic exponential backoff retry up to 3 times.
 */
export async function dispatchWebhook(eventName: string, payload: any) {
  try {
    // Find active endpoints that subscribe to this event or to all events ('*')
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        active: true,
      },
    });

    const targetEndpoints = endpoints.filter((ep) => 
      ep.events.split(',').includes(eventName) || ep.events.split(',').includes('*')
    );

    if (targetEndpoints.length === 0) return;

    // Create events in DB
    const events = await Promise.all(
      targetEndpoints.map((ep) =>
        prisma.webhookEvent.create({
          data: {
            endpointId: ep.id,
            event: eventName,
            payload: JSON.stringify(payload),
            status: 'pending',
          },
        })
      )
    );

    // Attempt delivery
    for (let i = 0; i < events.length; i++) {
      deliverEvent(events[i].id, targetEndpoints[i].url, targetEndpoints[i].secret, payload, 0);
    }
  } catch (error) {
    console.error(`Failed to initialize webhooks for event ${eventName}:`, error);
  }
}

async function deliverEvent(eventId: string, url: string, secret: string, payload: any, attempt: number) {
  const maxAttempts = 3;
  const payloadString = JSON.stringify(payload);
  
  // Generate HMAC Signature
  const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

  try {
    // Update DB to show attempt
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { attempts: attempt + 1 },
    });

    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Chess-Signature': signature,
        'X-Chess-Event': 'webhook', // We could put eventName here if we fetch it
      },
      timeout: 5000, // 5 seconds timeout
    });

    // Success
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'success', lastError: null },
    });
    console.log(`Webhook ${eventId} delivered successfully to ${url}`);

  } catch (error: any) {
    const errorMessage = error.response ? `HTTP ${error.response.status}` : error.message;
    console.error(`Webhook delivery failed to ${url}: ${errorMessage}`);

    if (attempt + 1 < maxAttempts) {
      // Exponential backoff: 2s, 4s
      const delay = Math.pow(2, attempt) * 2000;
      setTimeout(() => deliverEvent(eventId, url, secret, payload, attempt + 1), delay);
    } else {
      // Mark as failed permanently
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: 'failed', lastError: errorMessage },
      });
    }
  }
}
