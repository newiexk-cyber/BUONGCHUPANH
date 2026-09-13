/**
 * MAGIC BYTES VALIDATOR UTILITY
 * Inspects initial byte signatures to verify genuine image formats and block malicious files.
 */

const MAGIC_SIGNATURES = {
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  jpg: [0xFF, 0xD8, 0xFF],
  jpeg: [0xFF, 0xD8, 0xFF],
  gif: [0x47, 0x49, 0x46, 0x38], // 'GIF8'
  webp: [0x52, 0x49, 0x46, 0x46] // 'RIFF' (first 4 bytes)
};

/**
 * Validates buffer against known image magic bytes
 * @param {Buffer} buffer 
 * @param {string} expectedFormat 
 * @returns {boolean}
 */
function validateMagicBytes(buffer, expectedFormat) {
  if (!buffer || buffer.length < 8) return false;

  const fmt = (expectedFormat || '').toLowerCase();
  const signature = MAGIC_SIGNATURES[fmt];

  if (!signature) {
    // If format is not in map, check if it matches ANY valid image format
    return Object.values(MAGIC_SIGNATURES).some(sig => checkSignature(buffer, sig));
  }

  return checkSignature(buffer, signature);
}

function checkSignature(buffer, signature) {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Detects image format from raw buffer
 * @param {Buffer} buffer 
 * @returns {string|null}
 */
function detectFormat(buffer) {
  if (!buffer || buffer.length < 4) return null;

  if (checkSignature(buffer, MAGIC_SIGNATURES.png)) return 'png';
  if (checkSignature(buffer, MAGIC_SIGNATURES.jpg)) return 'jpg';
  if (checkSignature(buffer, MAGIC_SIGNATURES.gif)) return 'gif';
  if (checkSignature(buffer, MAGIC_SIGNATURES.webp)) return 'webp';

  return null;
}

module.exports = {
  validateMagicBytes,
  detectFormat
};
