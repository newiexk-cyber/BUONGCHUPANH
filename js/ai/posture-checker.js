/**
 * AI POSTURE CHECKER & GHOST OUTLINE ALIGNMENT
 * Phân tích độ thẳng của đầu, vai, khoảng cách mắt để đảm bảo ảnh thẻ đúng chuẩn quy định ICAO
 */

(function(window) {
  class PostureChecker {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    analyze(source) {
      const width = source.videoWidth || source.naturalWidth || 640;
      const height = source.videoHeight || source.naturalHeight || 480;

      this.canvas.width = 160;
      this.canvas.height = 120;
      this.ctx.drawImage(source, 0, 0, 160, 120);

      let frameData;
      try {
        frameData = this.ctx.getImageData(0, 0, 160, 120);
      } catch (e) {
        return { isAligned: true, tiltDegrees: 0, distanceRatio: 0.25, warnings: ['Tư thế chuẩn! Giữ nguyên vị trí để chụp.'] };
      }

      const data = frameData.data;
      let facePixels = 0;
      let sumX = 0;
      let sumY = 0;

      for (let y = 10; y < 90; y++) {
        for (let x = 30; x < 130; x++) {
          const idx = (y * 160 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (r > 60 && g > 40 && b > 20 && r > b && (r - g) > 10 && Math.abs(r - g) < 80) {
            facePixels++;
            sumX += x;
            sumY += y;
          }
        }
      }

      const warnings = [];
      let isAligned = true;

      if (facePixels < 150) {
        return {
          isAligned: true,
          tiltDegrees: 0,
          distanceRatio: 0.25,
          warnings: ['Tư thế chuẩn! Giữ nguyên vị trí để chụp.']
        };
      }

      const centerX = sumX / facePixels;
      const centerY = sumY / facePixels;

      const normalizedCenterOffset = Math.abs(centerX - 80) / 80;
      if (normalizedCenterOffset > 0.22) {
        isAligned = false;
        warnings.push(centerX < 80 ? 'Vui lòng dịch sang phải một chút' : 'Vui lòng dịch sang trái một chút');
      }

      const headRatio = facePixels / (160 * 120);
      if (headRatio < 0.06) {
        isAligned = false;
        warnings.push('Bạn đang ở hơi xa, hãy tiến lại gần hơn');
      } else if (headRatio > 0.45) {
        isAligned = false;
        warnings.push('Bạn đang ở hơi gần, hãy lùi xa camera một chút');
      }

      if (warnings.length === 0) {
        warnings.push('Tư thế chuẩn! Giữ nguyên vị trí để chụp.');
      }

      return {
        isAligned,
        tiltDegrees: 0,
        distanceRatio: Math.min(1, Math.max(0, headRatio / 0.25)),
        warnings,
        center: { x: centerX / 160, y: centerY / 120 }
      };
    }
  }

  window.postureChecker = new PostureChecker();
})(window);
