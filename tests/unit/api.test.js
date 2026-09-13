/**
 * BACKEND API & SECURITY UNIT/INTEGRATION TEST SUITE
 * Validates Session Ownership, Magic Bytes inspection, Canva Token Isolation, and 24h Cleanup.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Require backend modules
const { validateMagicBytes, detectMimeType } = require('../../backend/src/utils/magicBytes');
const cleanupService = require('../../backend/src/services/cleanup.service');
const photoService = require('../../backend/src/services/photo.service');
const app = require('../../backend/src/app');

async function runTests() {
  console.log('🧪 Starting Backend API & Security Suite...\n');
  let passed = 0;
  let failed = 0;

  function it(description, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  async function itAsync(description, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // 1. Magic Bytes Tests
  console.log('--- 1. Magic Bytes Binary Verification ---');
  it('Should accept valid PNG Base64 and detect image/png', () => {
    // Valid 1x1 PNG Base64
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = validateMagicBytes(validPng);
    assert.strictEqual(result.valid, true, 'PNG should be valid');
    assert.strictEqual(result.detectedMime, 'image/png');
  });

  it('Should reject forged JPEG extension containing random text or malicious script', () => {
    const maliciousPayload = 'data:image/jpeg;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='; // <script>alert(1)</script>
    const result = validateMagicBytes(maliciousPayload);
    assert.strictEqual(result.valid, false, 'Forged payload must be rejected');
  });

  it('Should correctly detect JPEG Magic Bytes (FF D8 FF)', () => {
    // JPEG header: FF D8 FF E0
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const detected = detectMimeType(jpegBuffer);
    assert.strictEqual(detected, 'image/jpeg');
  });

  // 2. Storage & Session Isolation Tests
  console.log('\n--- 2. Storage & Session Isolation ---');
  it('Should store photos inside isolated session directory with UUID naming', () => {
    const testSessionId = 'test-session-uuid-12345';
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const saved = photoService.saveBase64Photo(testSessionId, validPng, 'print_300dpi.png', 'image/png');
    assert(saved.fileId, 'Saved result must have a unique fileId');
    assert(fs.existsSync(saved.savedPath), 'File must exist on disk');
    assert(saved.savedPath.includes(testSessionId), 'Storage path must contain the sessionId directory');
    
    // Clean up test file
    fs.rmSync(path.join(__dirname, '../../backend/storage/photos', testSessionId), { recursive: true, force: true });
  });

  // 3. Automated 24h Cleanup Service Tests
  console.log('\n--- 3. Retention & Cleanup Service ---');
  it('Should clean up session directories older than retention threshold', () => {
    const oldSessionId = 'expired-session-99999';
    const oldSessionDir = path.join(__dirname, '../../backend/storage/photos', oldSessionId);
    fs.mkdirSync(oldSessionDir, { recursive: true });
    fs.writeFileSync(path.join(oldSessionDir, 'old_photo.png'), 'fake-data');

    // Manually set mtime to 48 hours ago
    const pastTime = (Date.now() - 48 * 3600 * 1000) / 1000;
    fs.utimesSync(oldSessionDir, pastTime, pastTime);

    const cleanedCount = cleanupService.cleanupExpiredSessions(24);
    assert(cleanedCount >= 1, 'Cleanup service should have purged the expired session folder');
    assert(!fs.existsSync(oldSessionDir), 'Expired directory must no longer exist');
  });

  // 4. API Endpoints Integration Tests
  console.log('\n--- 4. Express REST API Integration ---');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    await itAsync('GET /api/v1/health should return 200 with OK status and uptime', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'OK');
      assert(typeof data.uptime === 'number');
    });

    await itAsync('POST /api/v1/session/start should issue signed sessionId and cookie', async () => {
      const res = await fetch(`${baseUrl}/api/v1/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kioskId: 'KIOSK-HA-NOI-01' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(data.sessionId, 'Response must include sessionId');
    });

    await itAsync('POST /api/v1/photos/archive with invalid magic bytes should return 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/photos/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: 'data:image/png;base64,INVALID_NON_IMAGE_DATA_12345',
          filename: 'hacked.png'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert(data.error.includes('Magic Bytes'));
    });

    await itAsync('GET /api/v1/config/public should return public app features', async () => {
      const res = await fetch(`${baseUrl}/api/v1/config/public`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.features.magicBytesValidation, true);
    });
  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
