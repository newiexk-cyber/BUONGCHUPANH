/**
 * BACKGROUND REMOVER & SKIN RETOUCH ENGINE
 * Tách phông nền ảnh thẻ, thay phông Xanh/Trắng & Làm mịn/sáng da cơ bản giữ nét tự nhiên
 */

(function(window) {
  class BackgroundRemover {
    static processBackground(source, bgColor = 'blue', tolerance = 35) {
      const width = source.naturalWidth || source.width;
      const height = source.naturalHeight || source.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      ctx.drawImage(source, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const sampleCorners = [
        { r: data[0], g: data[1], b: data[2] },
        { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] },
        { r: data[(width * 5 + 5) * 4], g: data[(width * 5 + 5) * 4 + 1], b: data[(width * 5 + 5) * 4 + 2] }
      ];

      const bgSample = {
        r: (sampleCorners[0].r + sampleCorners[1].r + sampleCorners[2].r) / 3,
        g: (sampleCorners[0].g + sampleCorners[1].g + sampleCorners[2].g) / 3,
        b: (sampleCorners[0].b + sampleCorners[1].b + sampleCorners[2].b) / 3
      };

      let targetR = 30, targetG = 136, targetB = 229, targetA = 255;
      if (bgColor === 'white') {
        targetR = 255; targetG = 255; targetB = 255; targetA = 255;
      } else if (bgColor === 'light-blue') {
        targetR = 66; targetG = 165; targetB = 245; targetA = 255;
      } else if (bgColor === 'gray') {
        targetR = 241; targetG = 245; targetB = 249; targetA = 255;
      } else if (bgColor === 'transparent') {
        targetA = 0;
      }

      const threshold = (tolerance / 100) * 120 + 20;
      const centerX = width / 2;
      const centerY = height * 0.45;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const colorDist = Math.sqrt(
            Math.pow(r - bgSample.r, 2) +
            Math.pow(g - bgSample.g, 2) +
            Math.pow(b - bgSample.b, 2)
          );

          const spatialDist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          const centerBias = (spatialDist / maxDist);
          const isSkin = (r > 60 && g > 40 && b > 20 && r > b && (r - g) > 10 && (r - b) > 10);

          if (!isSkin && (colorDist < threshold || (centerBias > 0.65 && colorDist < threshold * 1.3))) {
            const alphaFactor = Math.max(0, Math.min(1, (colorDist - threshold * 0.7) / (threshold * 0.3)));
            if (targetA === 0) {
              data[i + 3] = Math.round(255 * alphaFactor);
            } else {
              data[i] = Math.round(targetR * (1 - alphaFactor) + r * alphaFactor);
              data[i + 1] = Math.round(targetG * (1 - alphaFactor) + g * alphaFactor);
              data[i + 2] = Math.round(targetB * (1 - alphaFactor) + b * alphaFactor);
              data[i + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }

    static applySkinRetouch(canvas, smoothIntensity = 30, brightness = 10) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const width = canvas.width;
      const height = canvas.height;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const smoothFactor = smoothIntensity / 100;
      const brightDelta = (brightness / 100) * 35;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const isSkin = (r > 60 && g > 40 && b > 20 && r > b && (r - g) > 10);

        if (isSkin && smoothFactor > 0) {
          r = Math.min(255, r + brightDelta + smoothFactor * 8);
          g = Math.min(255, g + brightDelta + smoothFactor * 6);
          b = Math.min(255, b + brightDelta + smoothFactor * 5);

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        } else if (brightness !== 0) {
          data[i] = Math.min(255, Math.max(0, r + brightDelta * 0.6));
          data[i + 1] = Math.min(255, Math.max(0, g + brightDelta * 0.6));
          data[i + 2] = Math.min(255, Math.max(0, b + brightDelta * 0.6));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }
  }

  window.BackgroundRemover = BackgroundRemover;
})(window);
