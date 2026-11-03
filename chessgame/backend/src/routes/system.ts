import express from 'express';
import os from 'os';

const router = express.Router();

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

// GET /api/system/info
router.get('/info', (req, res) => {
  res.json({
    version: '2.0.0',
    mode: 'lan',
    localIP: getLocalIP(),
    port: process.env.PORT || 5000,
  });
});

export default router;
