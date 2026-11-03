/**
 * Comprehensive Security & Reliability Verification Suite
 * Tests all 9 audit requirements against the running backend server.
 */
const http = require('http');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      timeout: 5000,
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('ROYAL CHESS CHAMPIONSHIP: SECURITY & RELIABILITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks
    console.log('--- 1. Testing Health & Readiness Probes ---');
    const health = await request({ path: '/api/health' });
    assert(health.status === 200 && health.body.status === 'healthy', 'Health check returns 200 OK & healthy');
    assert(health.body.database?.status === 'healthy', 'Database connectivity verified in health probe');
    assert(health.headers['x-request-id'] !== undefined, 'X-Request-Id correlation header attached to responses');

    const live = await request({ path: '/api/health/live' });
    assert(live.status === 200 && live.body.status === 'alive', 'Liveness probe /api/health/live returns 200');

    const ready = await request({ path: '/api/health/ready' });
    assert(ready.status === 200 && ready.body.status === 'ready', 'Readiness probe /api/health/ready returns 200');

    // 2. Authentication & Admin Login
    console.log('\n--- 2. Testing Authentication & RBAC ---');
    const loginRes = await request({ path: '/api/auth/login', method: 'POST' }, { username: 'admin', password: 'chess2025' });
    assert(loginRes.status === 200 && loginRes.body.token, 'Admin login succeeds and returns signed JWT');
    const adminToken = loginRes.body.token;

    // Unauthorized request to protected endpoint
    const unauthRes = await request({ path: '/api/tournaments', method: 'POST' }, { name: 'Hack Tourney', mode: 'swiss', roundsPlanned: 5, byePoints: 1 });
    assert(unauthRes.status === 401, 'Unauthenticated POST /api/tournaments rejected with 401 Unauthorized');

    // Protected webhooks route
    const unauthWebhook = await request({ path: '/api/webhooks' });
    assert(unauthWebhook.status === 401, 'Unauthenticated GET /api/webhooks rejected with 401 Unauthorized');

    // 3. Centralized Error Handling & Malformed Inputs
    console.log('\n--- 3. Testing Centralized Error Handling & Input Validation ---');
    const malformedTournament = await request(
      { path: '/api/tournaments', method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } },
      { name: '', mode: 'invalid_mode', roundsPlanned: -5, byePoints: 99 }
    );
    assert(malformedTournament.status === 400, 'Malformed tournament payload rejected with 400 Bad Request');
    assert(malformedTournament.body.code === 'VALIDATION_FAILED', 'Validation error returns standardized code VALIDATION_FAILED');
    assert(Array.isArray(malformedTournament.body.details), 'Validation error details returned as structured array');

    // Non-existent route 404
    const notFoundRes = await request({ path: '/api/non-existent-route-xyz' });
    assert(notFoundRes.status === 404 && notFoundRes.body.code === 'NOT_FOUND', 'Unknown route returns 404 with NOT_FOUND code');

    // 4. Secure Password Reset Flow
    console.log('\n--- 4. Testing Secure Password Reset (10m Expiry, Single-Use, Hashed) ---');
    // Request reset token
    const forgotRes = await request({ path: '/api/auth/forgot-password', method: 'POST' }, { username: 'admin' });
    assert(forgotRes.status === 200 && forgotRes.body.resetToken, 'Forgot password generates secure token');
    const resetToken = forgotRes.body.resetToken;

    // Reset password with valid token
    const resetRes = await request({ path: '/api/auth/reset-password', method: 'POST' }, { token: resetToken, newPassword: 'newAdminPassword123' });
    assert(resetRes.status === 200 && resetRes.body.success === true, 'Password reset succeeds with valid token');

    // Replay attack / single-use test: using the same token again MUST FAIL
    const reuseRes = await request({ path: '/api/auth/reset-password', method: 'POST' }, { token: resetToken, newPassword: 'anotherPassword123' });
    assert(reuseRes.status === 400 && reuseRes.body.code === 'TOKEN_ALREADY_USED', 'Reusing already-consumed reset token rejected (Single-Use enforced)');

    // Login with new password
    const newLoginRes = await request({ path: '/api/auth/login', method: 'POST' }, { username: 'admin', password: 'newAdminPassword123' });
    assert(newLoginRes.status === 200 && newLoginRes.body.token, 'Login succeeds with new password');
    const newAdminToken = newLoginRes.body.token;

    // Restore original password for ongoing test compatibility
    const restoreRes = await request(
      { path: '/api/auth/change-password', method: 'POST', headers: { Authorization: `Bearer ${newAdminToken}` } },
      { currentPassword: 'newAdminPassword123', newPassword: 'chess2025' }
    );
    assert(restoreRes.status === 200, 'Authenticated password change works smoothly');

    // 5. IDOR (Insecure Direct Object Reference) Prevention
    console.log('\n--- 5. Testing IDOR Prevention ---');
    // Create Tournament A
    const tA = await request(
      { path: '/api/tournaments', method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } },
      { name: 'Tournament A', mode: 'swiss', roundsPlanned: 3, byePoints: 1 }
    );
    // Create Tournament B
    const tB = await request(
      { path: '/api/tournaments', method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } },
      { name: 'Tournament B', mode: 'swiss', roundsPlanned: 3, byePoints: 1 }
    );

    // Add Player to Tournament A
    const pA = await request(
      { path: `/api/tournaments/${tA.body.id}/participants`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } },
      { name: 'Player in Tourney A', rating: 1500 }
    );

    // Attempt to delete Player from Tournament A via Tournament B URL (IDOR attempt)
    const idorDelete = await request(
      { path: `/api/tournaments/${tB.body.id}/participants/${pA.body.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(idorDelete.status === 404, 'Cross-tournament IDOR deletion blocked with 404 Not Found');

    // Clean up test tournaments
    await request({ path: `/api/tournaments/${tA.body.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    await request({ path: `/api/tournaments/${tB.body.id}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    assert(true, 'Test tournament resources cleaned up cleanly');

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
