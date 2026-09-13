/**
 * STANDALONE NATIVE UNIT TEST FOR BACKEND CORE SERVICES
 * Runs directly on Node.js without third-party dependencies.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { validateMagicBytes, detectFormat } = require('../../backend/src/utils/magicBytes');
const cleanupService = require('../../backend/src/services/cleanup.service');
const photoService = require('../../backend/src/services/photo.service');

async function runUnitTests() {
  console.log('🧪 Starting Photobooth Core Backend & Security Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  function test(description, fn) {
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

  async function testAsync(description, fn) {
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

  // 1. Magic Bytes Validation
  console.log('--- 1. Magic Bytes Binary Header Security ---');
  test('Accepts authentic PNG buffer and detects format "png"', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const isValid = validateMagicBytes(pngHeader, 'png');
    const detected = detectFormat(pngHeader);
    assert.strictEqual(isValid, true, 'PNG buffer should be valid');
    assert.strictEqual(detected, 'png', 'Detected format should be png');
  });

  test('Accepts authentic JPEG buffer and detects format "jpg"', () => {
    const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const isValid = validateMagicBytes(jpgHeader, 'jpg');
    const detected = detectFormat(jpgHeader);
    assert.strictEqual(isValid, true, 'JPEG buffer should be valid');
    assert.strictEqual(detected, 'jpg', 'Detected format should be jpg');
  });

  test('Rejects malicious script pretending to be an image', () => {
    const maliciousBuffer = Buffer.from('<script>alert("XSS")</script>');
    const isValid = validateMagicBytes(maliciousBuffer, 'png');
    const detected = detectFormat(maliciousBuffer);
    assert.strictEqual(isValid, false, 'Malicious buffer must be rejected');
    assert.strictEqual(detected, null, 'Detected format must be null');
  });

  // 2. Photo Storage & Session Isolation
  console.log('\n--- 2. Photo Storage & Session Isolation ---');
  await testAsync('Stores photos in private session directory with UUID v4 naming', async () => {
    const testSessionId = 'tenant-session-abc-123';
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const saved = await photoService.savePhoto(testSessionId, validPng, 'png', 'Test Caption');
    assert(saved.fileId, 'File must have UUID fileId');
    assert(saved.filename.startsWith('strip_'), 'Filename must start with strip_ prefix');
    assert.strictEqual(saved.sessionId, testSessionId, 'Session ID must match');

    // Verify session directory exists
    const sessionDir = path.join(__dirname, '../../backend/storage/photos', testSessionId);
    assert(fs.existsSync(sessionDir), 'Session folder must exist');

    const photos = await photoService.listPhotosBySession(testSessionId);
    assert.strictEqual(photos.length, 1, 'Photos list count should be 1');

    // Clean up
    fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  // 3. 24h Auto-cleanup Service
  console.log('\n--- 3. Retention & Cleanup Service ---');
  await testAsync('Purges session directories older than retention threshold (24h)', async () => {
    const oldSessionId = 'expired-session-to-purge';
    const oldSessionDir = path.join(__dirname, '../../backend/storage/photos', oldSessionId);
    fs.mkdirSync(oldSessionDir, { recursive: true });
    fs.writeFileSync(path.join(oldSessionDir, 'photo.png'), 'test');

    // Simulate 36 hours ago
    const pastTime = (Date.now() - 36 * 3600 * 1000) / 1000;
    fs.utimesSync(oldSessionDir, pastTime, pastTime);

    // Run cleanup
    await cleanupService.runCleanupNow();

    assert(!fs.existsSync(oldSessionDir), 'Expired directory must be purged');
  });

  console.log('\n========================================');
  console.log(`Core Unit Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests();
