/**
 * API Test Script — run with: node test_api.js
 * Tests all endpoints of the Campaign Management API
 */
const http = require('http');

const BASE = 'http://localhost:3000';
let TOKEN = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(label, res) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Status: ${res.status}`);
  console.log(`  Response:`, JSON.stringify(res.body, null, 2));
}

async function run() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║         Campaign Management API — Test Suite         ║
╚══════════════════════════════════════════════════════╝
  `);

  // 1. Health Check
  const health = await request('GET', '/api/health');
  log('1️⃣  HEALTH CHECK — GET /api/health', health);

  // 2. Login
  const login = await request('POST', '/api/auth/login', {
    email: 'admin@agency.com',
    password: 'admin123',
  });
  log('2️⃣  LOGIN — POST /api/auth/login', login);
  TOKEN = login.body.data?.token;

  if (!TOKEN) {
    console.error('\n❌ Login failed — cannot continue tests.');
    process.exit(1);
  }
  console.log(`\n  ✅ Token obtained: ${TOKEN.substring(0, 30)}...`);

  // 3. List campaigns (paginated)
  const list = await request('GET', '/api/campaigns?page=1&limit=3&status=active', null, TOKEN);
  log('3️⃣  LIST CAMPAIGNS — GET /api/campaigns?status=active&limit=3', list);

  // 4. Get single campaign with metrics
  const single = await request('GET', '/api/campaigns/1', null, TOKEN);
  log('4️⃣  GET SINGLE — GET /api/campaigns/1', single);

  // 5. Create a new campaign
  const create = await request('POST', '/api/campaigns', {
    name: 'Test Campaign',
    description: 'Created via test script',
    budget: 7500,
    start_date: '2025-08-01',
    end_date: '2025-10-31',
  }, TOKEN);
  log('5️⃣  CREATE — POST /api/campaigns', create);
  const newId = create.body.data?.id;

  // 6. Update the campaign
  if (newId) {
    const update = await request('PUT', `/api/campaigns/${newId}`, {
      name: 'Updated Test Campaign',
      budget: 12000,
      status: 'paused',
    }, TOKEN);
    log('6️⃣  UPDATE — PUT /api/campaigns/' + newId, update);
  }

  // 7. Soft delete the campaign
  if (newId) {
    const del = await request('DELETE', `/api/campaigns/${newId}`, null, TOKEN);
    log('7️⃣  DELETE — DELETE /api/campaigns/' + newId, del);
  }

  // 8. Verify deleted campaign returns 404
  if (newId) {
    const verify = await request('GET', `/api/campaigns/${newId}`, null, TOKEN);
    log('8️⃣  VERIFY 404 — GET /api/campaigns/' + newId, verify);
  }

  // 9. Validation error test (missing required fields)
  const badInput = await request('POST', '/api/campaigns', { description: 'missing fields' }, TOKEN);
  log('9️⃣  VALIDATION ERROR — POST with bad input', badInput);

  // 10. Unauthorized test (no token)
  const noAuth = await request('GET', '/api/campaigns');
  log('🔟  UNAUTHORIZED — GET /api/campaigns (no token)', noAuth);

  // 11. Search
  const search = await request('GET', '/api/campaigns?search=Summer&sort_by=budget&sort_order=desc', null, TOKEN);
  log('1️⃣1️⃣  SEARCH — GET /api/campaigns?search=Summer', search);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  ✅ ALL TESTS COMPLETE');
  console.log(`${'═'.repeat(60)}\n`);
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
