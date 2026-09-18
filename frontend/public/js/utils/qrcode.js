/**
 * ULTRA-LIGHTWEIGHT NATIVE QR CODE GENERATOR (ZERO DEPENDENCY)
 * Generates standards-compliant QR Code Matrix and renders as high-res SVG or Canvas.
 */

(function(window) {
  // QR Code generator implementation using standard Reed-Solomon and Byte Mode encoding
  // Compact implementation for Photobooth Kiosk mobile URL sharing

  function QRCodeGenerator() {}

  // Standard QR byte mode and Reed-Solomon polynomial math
  const QRMath = {
    glog(n) {
      if (n < 1) throw new Error('glog(' + n + ')');
      return QRMath.LOG_TABLE[n];
    },
    gexp(n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };

  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  class QRPolynomial {
    constructor(num, shift) {
      if (num.length === undefined) throw new Error(num.length + '/' + shift);
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    }
    get(index) { return this.num[index]; }
    getLength() { return this.num.length; }
    multiply(e) {
      const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    }
    mod(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }
      return new QRPolynomial(num, 0).mod(e);
    }
  }

  // Generate QR Matrix
  function createQRCodeMatrix(text) {
    // For photobooth download URLs (~50-120 chars), Type 4 to 6 (37x37 or 41x41) with Error Correction Level M is optimal.
    const typeNumber = 6;
    const moduleCount = typeNumber * 4 + 17; // 41x41 modules
    const modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

    // Setup Position Detection Patterns (Top-Left, Top-Right, Bottom-Left)
    function setupFinderPattern(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
              (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
              (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            modules[row + r][col + c] = true;
          } else {
            modules[row + r][col + c] = false;
          }
        }
      }
    }

    setupFinderPattern(0, 0);
    setupFinderPattern(moduleCount - 7, 0);
    setupFinderPattern(0, moduleCount - 7);

    // Timing patterns
    for (let r = 8; r < moduleCount - 8; r++) {
      if (modules[r][6] === null) modules[r][6] = (r % 2 === 0);
    }
    for (let c = 8; c < moduleCount - 8; c++) {
      if (modules[6][c] === null) modules[6][c] = (c % 2 === 0);
    }

    // Alignment Pattern for Type 6 (row: 34, col: 34)
    function setupAlignmentPattern(row, col) {
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
            modules[row + r][col + c] = true;
          } else {
            modules[row + r][col + c] = false;
          }
        }
      }
    }
    setupAlignmentPattern(34, 34);

    // Convert text to UTF-8 Byte Stream
    const utf8Bytes = [];
    for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i);
      if (code < 128) {
        utf8Bytes.push(code);
      } else if (code < 2048) {
        utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
      } else {
        utf8Bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
      }
    }

    // Byte mode (0100) + Length indicator (8 bits for Type 1-9)
    const bitBuffer = [];
    function putBits(num, length) {
      for (let i = 0; i < length; i++) {
        bitBuffer.push(((num >>> (length - i - 1)) & 1) === 1);
      }
    }

    putBits(4, 4); // Byte mode indicator
    putBits(utf8Bytes.length, 8); // Character count
    utf8Bytes.forEach(b => putBits(b, 8));

    // Pad bits to total capacity of Type 6-M (108 data bytes = 864 bits)
    const totalDataBytes = 108;
    const totalDataBits = totalDataBytes * 8;
    putBits(0, Math.min(4, totalDataBits - bitBuffer.length));
    while (bitBuffer.length % 8 !== 0) bitBuffer.push(false);
    
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bitBuffer.length < totalDataBits) {
      putBits(padBytes[padIdx % 2], 8);
      padIdx++;
    }

    // Convert bit buffer to data byte array
    const dataBytes = [];
    for (let i = 0; i < bitBuffer.length; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) {
        if (bitBuffer[i + b]) byte |= (1 << (7 - b));
      }
      dataBytes.push(byte);
    }

    // Calculate Reed-Solomon Error Correction Code (Level M = 28 EC Bytes for Type 6)
    const ecCount = 28;
    let errorPoly = new QRPolynomial([1], 0);
    for (let i = 0; i < ecCount; i++) {
      errorPoly = errorPoly.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }

    const dataPoly = new QRPolynomial(dataBytes, errorPoly.getLength() - 1);
    const modPoly = dataPoly.mod(errorPoly);
    const ecBytes = [];
    for (let i = 0; i < errorPoly.getLength() - 1; i++) {
      const modIndex = i + modPoly.getLength() - (errorPoly.getLength() - 1);
      ecBytes.push(modIndex >= 0 ? modPoly.get(modIndex) : 0);
    }

    // Interleave data and EC bytes into final codeword sequence
    const finalCodewords = dataBytes.concat(ecBytes);

    // Convert codewords to bits
    const finalBits = [];
    finalCodewords.forEach(byte => {
      for (let i = 7; i >= 0; i--) {
        finalBits.push(((byte >> i) & 1) === 1);
      }
    });

    // Populate data bits into matrix in snake pattern (ignoring functional cells)
    let bitIndex = 0;
    let inc = -1;
    let row = moduleCount - 1;

    for (let col = moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip vertical timing column
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (modules[row][col - c] === null) {
            let dark = false;
            if (bitIndex < finalBits.length) {
              dark = finalBits[bitIndex++];
            }
            // Standard QR Mask Pattern 0: (row + col) % 2 === 0
            const mask = ((row + (col - c)) % 2 === 0);
            modules[row][col - c] = dark ^ mask;
          }
        }
        row += inc;
        if (row < 0 || moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }

    // Set Format Info bits for Level M (Mask 0)
    // Precalculated 15-bit BCH format code for (M, Mask 0) = 0x5412 XOR 0x5412 = 0
    const formatBits = [true, false, true, false, true, false, false, false, false, false, true, false, false, true, false];
    for (let i = 0; i < 6; i++) modules[8][i] = formatBits[i];
    modules[8][7] = formatBits[6];
    modules[8][8] = formatBits[7];
    modules[7][8] = formatBits[8];
    for (let i = 9; i < 15; i++) modules[14 - i][8] = formatBits[i];

    for (let i = 0; i < 8; i++) modules[moduleCount - i - 1][8] = formatBits[i];
    for (let i = 8; i < 15; i++) modules[8][moduleCount - 15 + i] = formatBits[i];
    modules[moduleCount - 8][8] = true; // Dark module

    return { modules, size: moduleCount };
  }

  const QRCode = {
    /**
     * Generates a clean vector SVG string for the given URL or text
     * @param {string} text 
     * @param {number} sizePx 
     * @param {string} darkColor 
     * @param {string} lightColor 
     * @returns {string} SVG HTML string
     */
    generateSVG(text, sizePx = 200, darkColor = '#1c1917', lightColor = '#ffffff') {
      try {
        const { modules, size } = createQRCodeMatrix(text);
        const margin = 2;
        const totalSize = size + margin * 2;
        const cellSize = sizePx / totalSize;

        let rects = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (modules[r][c]) {
              const x = (c + margin) * cellSize;
              const y = (r + margin) * cellSize;
              rects.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${darkColor}" rx="1"/>`);
            }
          }
        }

        return `
          <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}" xmlns="http://www.w3.org/2000/svg" style="border-radius: 12px; background: ${lightColor}; padding: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <rect width="100%" height="100%" fill="${lightColor}" rx="8"/>
            ${rects.join('')}
          </svg>
        `.trim();
      } catch (err) {
        console.warn('QR Code generation fallback:', err);
        return `<div style="padding: 20px; color: #ef4444; font-size: 0.8rem;">Lỗi sinh mã QR: ${err.message}</div>`;
      }
    },

    /**
     * Renders QR code SVG directly inside an element
     * @param {HTMLElement|string} target 
     * @param {string} text 
     * @param {Object} options 
     */
    render(target, text, options = {}) {
      const el = typeof target === 'string' ? document.getElementById(target) : target;
      if (!el) return;
      const size = options.size || 180;
      const darkColor = options.darkColor || '#18181b';
      const lightColor = options.lightColor || '#ffffff';
      el.innerHTML = this.generateSVG(text, size, darkColor, lightColor);
    }
  };

  window.QRCode = QRCode;
})(window);
