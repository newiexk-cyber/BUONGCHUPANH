/**
 * SMART SUIT INPAINTING & ATTIRE OVERLAY ENGINE
 * Tự động tạo và ghép trang phục công sở (Áo sơ mi nam/nữ, vest chuẩn công sở) vào ảnh thẻ
 */

(function(window) {
  class SuitInpaintEngine {
    constructor() {
      this.suitTemplates = {
        'men-white-shirt': {
          id: 'men-white-shirt',
          name: 'Sơ mi trắng Nam + Cà vạt xanh',
          gender: 'male',
          draw: (ctx, w, h) => this.drawMenWhiteShirt(ctx, w, h)
        },
        'men-black-suit': {
          id: 'men-black-suit',
          name: 'Vest đen Nam lịch lãm',
          gender: 'male',
          draw: (ctx, w, h) => this.drawMenBlackSuit(ctx, w, h)
        },
        'women-white-shirt': {
          id: 'women-white-shirt',
          name: 'Sơ mi trắng Nữ công sở',
          gender: 'female',
          draw: (ctx, w, h) => this.drawWomenWhiteShirt(ctx, w, h)
        },
        'women-navy-blazer': {
          id: 'women-navy-blazer',
          name: 'Vest Navy Nữ thanh lịch',
          gender: 'female',
          draw: (ctx, w, h) => this.drawWomenNavyBlazer(ctx, w, h)
        }
      };
    }

    getTemplates() {
      return Object.values(this.suitTemplates);
    }

    generateSuitCanvas(suitId, width = 600, height = 400) {
      const template = this.suitTemplates[suitId] || this.suitTemplates['men-white-shirt'];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      template.draw(ctx, width, height);
      return canvas;
    }

    drawMenWhiteShirt(ctx, w, h) {
      const cx = w / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 190, h);
      ctx.lineTo(cx - 150, h * 0.45);
      ctx.quadraticCurveTo(cx - 70, h * 0.28, cx, h * 0.35);
      ctx.quadraticCurveTo(cx + 70, h * 0.28, cx + 150, h * 0.45);
      ctx.lineTo(cx + 190, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 75, h * 0.25);
      ctx.lineTo(cx - 15, h * 0.52);
      ctx.lineTo(cx - 50, h * 0.58);
      ctx.lineTo(cx - 95, h * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 75, h * 0.25);
      ctx.lineTo(cx + 15, h * 0.52);
      ctx.lineTo(cx + 50, h * 0.58);
      ctx.lineTo(cx + 95, h * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(cx - 18, h * 0.48);
      ctx.lineTo(cx + 18, h * 0.48);
      ctx.lineTo(cx + 12, h * 0.60);
      ctx.lineTo(cx - 12, h * 0.60);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx - 12, h * 0.60);
      ctx.lineTo(cx + 12, h * 0.60);
      ctx.lineTo(cx + 24, h);
      ctx.lineTo(cx - 24, h);
      ctx.closePath();
      ctx.fill();
    }

    drawMenBlackSuit(ctx, w, h) {
      const cx = w / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 80, h * 0.3);
      ctx.lineTo(cx, h * 0.7);
      ctx.lineTo(cx + 80, h * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(cx - 12, h * 0.48);
      ctx.lineTo(cx + 12, h * 0.48);
      ctx.lineTo(cx + 18, h);
      ctx.lineTo(cx - 18, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 65, h * 0.28);
      ctx.lineTo(cx - 10, h * 0.5);
      ctx.lineTo(cx - 45, h * 0.55);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 65, h * 0.28);
      ctx.lineTo(cx + 10, h * 0.5);
      ctx.lineTo(cx + 45, h * 0.55);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(cx - 220, h);
      ctx.lineTo(cx - 170, h * 0.45);
      ctx.quadraticCurveTo(cx - 90, h * 0.28, cx - 60, h * 0.35);
      ctx.lineTo(cx - 15, h * 0.78);
      ctx.lineTo(cx - 20, h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 220, h);
      ctx.lineTo(cx + 170, h * 0.45);
      ctx.quadraticCurveTo(cx + 90, h * 0.28, cx + 60, h * 0.35);
      ctx.lineTo(cx + 15, h * 0.78);
      ctx.lineTo(cx + 20, h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    drawWomenWhiteShirt(ctx, w, h) {
      const cx = w / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 180, h);
      ctx.lineTo(cx - 140, h * 0.45);
      ctx.quadraticCurveTo(cx - 60, h * 0.26, cx, h * 0.38);
      ctx.quadraticCurveTo(cx + 60, h * 0.26, cx + 140, h * 0.45);
      ctx.lineTo(cx + 180, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(cx - 70, h * 0.26);
      ctx.lineTo(cx - 20, h * 0.48);
      ctx.lineTo(cx - 60, h * 0.52);
      ctx.lineTo(cx - 85, h * 0.32);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 70, h * 0.26);
      ctx.lineTo(cx + 20, h * 0.48);
      ctx.lineTo(cx + 60, h * 0.52);
      ctx.lineTo(cx + 85, h * 0.32);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      for (let y = h * 0.58; y < h; y += 35) {
        ctx.beginPath();
        ctx.arc(cx, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawWomenNavyBlazer(ctx, w, h) {
      const cx = w / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 50, h * 0.32);
      ctx.lineTo(cx, h * 0.65);
      ctx.lineTo(cx + 50, h * 0.32);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(cx - 200, h);
      ctx.lineTo(cx - 150, h * 0.44);
      ctx.quadraticCurveTo(cx - 70, h * 0.28, cx - 45, h * 0.32);
      ctx.lineTo(cx - 5, h * 0.75);
      ctx.lineTo(cx - 10, h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 200, h);
      ctx.lineTo(cx + 150, h * 0.44);
      ctx.quadraticCurveTo(cx + 70, h * 0.28, cx + 45, h * 0.32);
      ctx.lineTo(cx + 5, h * 0.75);
      ctx.lineTo(cx + 10, h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  window.suitInpaintEngine = new SuitInpaintEngine();
})(window);
