/**
 * HIGH-DEFINITION ADAPTIVE GIF89a ENCODER (Median Cut, Fast 15-bit Lookup & Floyd-Steinberg Dithering)
 * Tạo ảnh động GIF Hậu trường / Live Motion Timelapse chất lượng cao (HD), mượt mà, lưu toàn bộ quá trình tạo dáng
 */
(function(window) {
  class SimpleGifEncoder {
    constructor(width, height) {
      this.width = width || 640;
      this.height = height || 480;
      this.frames = [];
      this.delay = 10; // 100ms per frame default
      this.repeat = 0; // Infinite loop
      this.dither = true; // Floyd-Steinberg dithering for smooth skin gradients
    }

    setDelay(ms) {
      this.delay = Math.max(2, Math.round(ms / 10));
    }

    addFrame(ctx, width, height, delayMs) {
      const w = width || this.width;
      const h = height || this.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      this.frames.push({
        data: imgData.data,
        delay: delayMs ? Math.max(2, Math.round(delayMs / 10)) : this.delay
      });
    }

    // Build Live Motion Timelapse (toàn bộ quá trình từ dáng 1 -> 8 kèm điểm dừng flash)
    buildMotionTimelapseFrames(frameDataList) {
      this.frames = [];
      if (!frameDataList || frameDataList.length === 0) return;

      frameDataList.forEach(item => {
        if (item.canvas) {
          const ctx = item.canvas.getContext('2d');
          this.addFrame(ctx, item.canvas.width, item.canvas.height, item.delayMs || 110);
        } else if (item.getContext) {
          const ctx = item.getContext('2d');
          this.addFrame(ctx, item.width, item.height, 110);
        }
      });
    }

    // Build Ping-Pong Boomerang Frames
    buildBoomerangFrames(canvasList) {
      this.frames = [];
      const len = canvasList.length;
      if (len === 0) return;

      const pingPong = [];
      for (let i = 0; i < len; i++) pingPong.push(canvasList[i]);
      for (let i = len - 2; i > 0; i--) pingPong.push(canvasList[i]);

      pingPong.forEach(canv => {
        const ctx = canv.getContext('2d');
        this.addFrame(ctx, canv.width, canv.height, 120);
      });
    }

    /* -------------------------------------------------------------
       MEDIAN CUT COLOR QUANTIZER (256 Tông màu thông minh)
       ------------------------------------------------------------- */
    generateAdaptivePalette(frames) {
      const samplePixels = [];
      const maxSamples = 30000;
      let totalPixels = 0;
      frames.forEach(f => { totalPixels += f.data.length / 4; });
      const sampleStep = Math.max(1, Math.floor(totalPixels / maxSamples));

      let stepCounter = 0;
      frames.forEach(f => {
        const d = f.data;
        for (let i = 0; i < d.length; i += 4) {
          stepCounter++;
          if (stepCounter % sampleStep === 0) {
            samplePixels.push([d[i], d[i + 1], d[i + 2]]);
          }
        }
      });

      // Box structure for Median Cut
      class VBox {
        constructor(pixels) {
          this.pixels = pixels;
          this.computeBounds();
        }
        computeBounds() {
          let rmin = 255, rmax = 0, gmin = 255, gmax = 0, bmin = 255, bmax = 0;
          for (let i = 0; i < this.pixels.length; i++) {
            const p = this.pixels[i];
            if (p[0] < rmin) rmin = p[0]; if (p[0] > rmax) rmax = p[0];
            if (p[1] < gmin) gmin = p[1]; if (p[1] > gmax) gmax = p[1];
            if (p[2] < bmin) bmin = p[2]; if (p[2] > bmax) bmax = p[2];
          }
          this.rmin = rmin; this.rmax = rmax;
          this.gmin = gmin; this.gmax = gmax;
          this.bmin = bmin; this.bmax = bmax;
          this.dr = rmax - rmin;
          this.dg = gmax - gmin;
          this.db = bmax - bmin;
          this.volume = (this.dr + 1) * (this.dg + 1) * (this.db + 1);
        }
        split() {
          if (this.pixels.length <= 1) return [this];
          let axis = 0; // 0=R, 1=G, 2=B
          if (this.dg >= this.dr && this.dg >= this.db) axis = 1;
          else if (this.db >= this.dr && this.db >= this.dg) axis = 2;

          this.pixels.sort((a, b) => a[axis] - b[axis]);
          const mid = Math.floor(this.pixels.length / 2);
          const box1 = new VBox(this.pixels.slice(0, mid));
          const box2 = new VBox(this.pixels.slice(mid));
          return [box1, box2];
        }
        avgColor() {
          if (this.pixels.length === 0) return [0, 0, 0];
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < this.pixels.length; i++) {
            r += this.pixels[i][0];
            g += this.pixels[i][1];
            b += this.pixels[i][2];
          }
          return [
            Math.round(r / this.pixels.length),
            Math.round(g / this.pixels.length),
            Math.round(b / this.pixels.length)
          ];
        }
      }

      let boxes = [new VBox(samplePixels)];
      while (boxes.length < 256) {
        let maxBoxIdx = -1;
        let maxVol = -1;
        for (let i = 0; i < boxes.length; i++) {
          if (boxes[i].pixels.length > 1 && boxes[i].volume > maxVol) {
            maxVol = boxes[i].volume;
            maxBoxIdx = i;
          }
        }
        if (maxBoxIdx === -1) break;
        const toSplit = boxes.splice(maxBoxIdx, 1)[0];
        const [b1, b2] = toSplit.split();
        boxes.push(b1);
        if (b2) boxes.push(b2);
      }

      const palette = boxes.map(b => b.avgColor());
      while (palette.length < 256) {
        palette.push([0, 0, 0]);
      }
      return palette.slice(0, 256);
    }

    encode() {
      if (this.frames.length === 0) return '';
      const out = [];
      const writeByte = (b) => out.push(b & 0xFF);
      const writeShort = (s) => { writeByte(s & 0xFF); writeByte((s >> 8) & 0xFF); };
      const writeString = (str) => { for (let i = 0; i < str.length; i++) writeByte(str.charCodeAt(i)); };

      // 1. Sinh bảng 256 màu tối ưu cho ảnh
      const palette = this.generateAdaptivePalette(this.frames);

      // 2. Xây dựng bảng tra cứu nhanh 15-bit (32,768 mục) để đạt tốc độ O(1)
      const lookupTable = new Uint8Array(32768);
      for (let r5 = 0; r5 < 32; r5++) {
        const rVal = (r5 << 3) | (r5 >> 2);
        for (let g5 = 0; g5 < 32; g5++) {
          const gVal = (g5 << 3) | (g5 >> 2);
          for (let b5 = 0; b5 < 32; b5++) {
            const bVal = (b5 << 3) | (b5 >> 2);
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let i = 0; i < 256; i++) {
              const pr = palette[i][0];
              const pg = palette[i][1];
              const pb = palette[i][2];
              const dr = rVal - pr;
              const dg = gVal - pg;
              const db = bVal - pb;
              const dist = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
                if (dist === 0) break;
              }
            }
            lookupTable[(r5 << 10) | (g5 << 5) | b5] = bestIdx;
          }
        }
      }

      const findNearestColor = (r, g, b) => {
        const r5 = Math.min(31, Math.max(0, r >> 3));
        const g5 = Math.min(31, Math.max(0, g >> 3));
        const b5 = Math.min(31, Math.max(0, b >> 3));
        return lookupTable[(r5 << 10) | (g5 << 5) | b5];
      };

      // Header: GIF89a
      writeString("GIF89a");

      // Logical Screen Descriptor
      writeShort(this.width);
      writeShort(this.height);
      writeByte(0xF7); // Global Color Table Flag (256 colors)
      writeByte(0);    // Background color index
      writeByte(0);    // Pixel aspect ratio

      // Ghi bảng màu toàn cục (256 Colors)
      for (let i = 0; i < 256; i++) {
        writeByte(palette[i][0]);
        writeByte(palette[i][1]);
        writeByte(palette[i][2]);
      }

      // Netscape Application Extension (Infinite loop)
      writeByte(0x21); // Extension Introducer
      writeByte(0xFF); // Application Extension Label
      writeByte(11);   // Block Size
      writeString("NETSCAPE2.0");
      writeByte(3);    // Sub-block size
      writeByte(1);    // Loop sub-block ID
      writeShort(this.repeat); // Loop count (0 = infinite)
      writeByte(0);    // Block Terminator

      const w = this.width;
      const h = this.height;

      // Thêm từng frame với Floyd-Steinberg error diffusion
      this.frames.forEach((frame) => {
        // Graphic Control Extension
        writeByte(0x21);
        writeByte(0xF9);
        writeByte(4);    // Block size
        writeByte(0x04); // Disposal method: Restore background
        writeShort(frame.delay || this.delay);
        writeByte(0);    // Transparent color index
        writeByte(0);    // Block Terminator

        // Image Descriptor
        writeByte(0x2C);
        writeShort(0); // Left
        writeShort(0); // Top
        writeShort(w);
        writeShort(h);
        writeByte(0);  // Use Global color table

        // Floyd-Steinberg Dithering
        const data = new Float32Array(frame.data);
        const indexedPixels = new Uint8Array(w * h);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = Math.min(255, Math.max(0, data[idx]));
            const g = Math.min(255, Math.max(0, data[idx + 1]));
            const b = Math.min(255, Math.max(0, data[idx + 2]));

            const colorIdx = findNearestColor(Math.round(r), Math.round(g), Math.round(b));
            indexedPixels[y * w + x] = colorIdx;

            if (this.dither) {
              const pr = palette[colorIdx][0];
              const pg = palette[colorIdx][1];
              const pb = palette[colorIdx][2];
              const er = r - pr;
              const eg = g - pg;
              const eb = b - pb;

              // Phân tán lỗi lượng tử hóa sang các pixel lân cận
              if (x + 1 < w) {
                const n = (y * w + (x + 1)) * 4;
                data[n] += er * 0.4375; data[n + 1] += eg * 0.4375; data[n + 2] += eb * 0.4375; // 7/16
              }
              if (y + 1 < h) {
                if (x > 0) {
                  const n = ((y + 1) * w + (x - 1)) * 4;
                  data[n] += er * 0.1875; data[n + 1] += eg * 0.1875; data[n + 2] += eb * 0.1875; // 3/16
                }
                const n0 = ((y + 1) * w + x) * 4;
                data[n0] += er * 0.3125; data[n0 + 1] += eg * 0.3125; data[n0 + 2] += eb * 0.3125; // 5/16
                if (x + 1 < w) {
                  const n1 = ((y + 1) * w + (x + 1)) * 4;
                  data[n1] += er * 0.0625; data[n1 + 1] += eg * 0.0625; data[n1 + 2] += eb * 0.0625; // 1/16
                }
              }
            }
          }
        }

        // LZW Compression
        this.writeLZW(out, indexedPixels, 8);
      });

      // GIF Trailer
      writeByte(0x3B);

      // Chuyển sang Base64 Data URL
      const uint8 = new Uint8Array(out);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
      }
      return 'data:image/gif;base64,' + btoa(binary);
    }

    writeLZW(out, pixels, minCodeSize) {
      const clearCode = 1 << minCodeSize;
      const eoiCode = clearCode + 1;
      let codeSize = minCodeSize + 1;
      let nextCode = clearCode + 2;

      let curBit = 0;
      let curByte = 0;
      const buffer = [];

      const emitBits = (code, bits) => {
        curByte |= (code << curBit);
        curBit += bits;
        while (curBit >= 8) {
          buffer.push(curByte & 0xFF);
          curByte >>= 8;
          curBit -= 8;
        }
      };

      const flushBuffer = () => {
        if (curBit > 0) {
          buffer.push(curByte & 0xFF);
          curByte = 0;
          curBit = 0;
        }
        for (let i = 0; i < buffer.length; i += 254) {
          const chunk = buffer.slice(i, i + 254);
          out.push(chunk.length);
          for (let j = 0; j < chunk.length; j++) out.push(chunk[j]);
        }
        out.push(0); // Sub-block terminator
      };

      out.push(minCodeSize);

      let table = new Map();
      const resetTable = () => {
        table.clear();
        for (let i = 0; i < clearCode; i++) {
          table.set(String.fromCharCode(i), i);
        }
        codeSize = minCodeSize + 1;
        nextCode = clearCode + 2;
      };

      resetTable();
      emitBits(clearCode, codeSize);

      let str = "";
      for (let i = 0; i < pixels.length; i++) {
        const c = String.fromCharCode(pixels[i]);
        const combined = str + c;
        if (table.has(combined)) {
          str = combined;
        } else {
          emitBits(table.get(str), codeSize);
          if (nextCode < 4096) {
            table.set(combined, nextCode++);
            if (nextCode > (1 << codeSize) && codeSize < 12) {
              codeSize++;
            }
          } else {
            emitBits(clearCode, codeSize);
            resetTable();
          }
          str = c;
        }
      }

      if (str.length > 0) {
        emitBits(table.get(str), codeSize);
      }
      emitBits(eoiCode, codeSize);
      flushBuffer();
    }
  }

  window.SimpleGifEncoder = SimpleGifEncoder;
})(window);
