/**
 * Production Health Check Verification Script.
 * Probes the /api/health endpoint and exits with 0 on success, or 1 on failure.
 */
const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 4000,
};

console.log(`Pinging health check at http://${HOST}:${PORT}/api/health...`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200 && parsed.status === 'healthy') {
        console.log('✓ Health check PASSED:');
        console.log(`  - Service: ${parsed.service} (v${parsed.version})`);
        console.log(`  - Database: ${parsed.database.status} (${parsed.database.latencyMs}ms)`);
        console.log(`  - Uptime: ${parsed.uptimeSeconds}s`);
        console.log(`  - Memory: ${parsed.system.nodeMemoryUsageMB.heapUsed}MB / ${parsed.system.nodeMemoryUsageMB.heapTotal}MB`);
        process.exit(0);
      } else {
        console.error(`✗ Health check FAILED with status ${res.statusCode}:`, parsed);
        process.exit(1);
      }
    } catch (e) {
      console.error('✗ Failed to parse health check response:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('✗ Health check request connection error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  console.error('✗ Health check request timed out after 4000ms');
  process.exit(1);
});

req.end();
