/**
 * 300 DPI PHOTO STRIP & LAYOUT RENDERING ENGINE
 * Builds print-ready canvas outputs, film strips, and motion animations.
 */

(function(window) {
  class FrameRenderer {
    /**
     * Renders complete photo strip onto target canvas
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} state 
     */
    renderFilmStrip(canvas, state) {
      if (!canvas) return;

      const layout = state.config.layout || 'strip-4';
      let w = 800, h = 2400;

      if (layout === 'strip-4') {
        w = 800; h = 2400;
      } else if (['grid-4', 'sole-4', 'dantu-4', 'vom-4', 'sotay-4'].includes(layout)) {
        w = 1600; h = 1600;
      } else if (['dual-strip-8', 'grid-8'].includes(layout)) {
        w = 1600; h = 2400;
      } else if (layout === 'sotay-8') {
        w = 1800; h = 2400;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // 1. Fill Background Color
      ctx.fillStyle = state.config.stripColor || '#0c0c0e';
      ctx.fillRect(0, 0, w, h);

      const shots = this.getValidShots(state);
      const filterKey = state.config.filter || 'goc';

      // 2. Render Photos by Layout Template
      this.drawPhotosByLayout(ctx, layout, shots, filterKey, w, h);

      // 3. Render Caption & Vintage Date Stamp
      this.drawCaptionsAndDate(ctx, state, w, h);

      // 4. Render Custom Canva Overlay Frame (if any)
      if (state.customFrameImage) {
        ctx.drawImage(state.customFrameImage, 0, 0, w, h);
      }

      // 5. Render Stickers & Custom Texts
      this.drawStickers(ctx, state.stickers, w, h);
    }

    getValidShots(state) {
      if (state.capturedShots && state.capturedShots.length > 0) {
        return state.capturedShots;
      }

      // Fallback demo shots
      const demoShots = [];
      const cvs = document.createElement('canvas');
      cvs.width = 640; cvs.height = 480;
      const cCtx = cvs.getContext('2d');
      if (window.cameraManager) {
        window.cameraManager.drawDemoPortrait(cCtx, 640, 480);
      }
      const dataUrl = cvs.toDataURL('image/jpeg');
      const img = new Image();
      img.src = dataUrl;

      for (let i = 0; i < 8; i++) {
        demoShots.push({ imgElement: img, dataUrl, index: i + 1 });
      }
      return demoShots;
    }

    drawPhotosByLayout(ctx, layout, shots, filterKey, w, h) {
      const fe = window.FilterEngine;

      if (layout === 'strip-4') {
        // Korean Classic 4-Cut Strip
        const imgW = 680, imgH = 510, padX = 60, startY = 60, gapY = 40;
        for (let i = 0; i < 4; i++) {
          const shot = shots[i];
          if (!shot || !shot.imgElement) continue;
          const y = startY + i * (imgH + gapY);
          fe.drawFilteredImage(ctx, shot.imgElement, padX, y, imgW, imgH, filterKey);
        }
      } else if (layout === 'grid-4') {
        // 2x2 Square Grid
        const size = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot && shot.imgElement) fe.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, size, size, filterKey);
        });
      } else if (layout === 'sole-4') {
        // Staggered 4-Cut
        const imgW = 680, imgH = 510;
        const positions = [{ x: 60, y: 60 }, { x: 860, y: 180 }, { x: 60, y: 760 }, { x: 860, y: 880 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot && shot.imgElement) fe.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, imgW, imgH, filterKey);
        });
      } else if (layout === 'dantu-4') {
        // Polaroid Refrigerator Stickers
        const pw = 680, ph = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot && shot.imgElement) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(positions[i].x - 14, positions[i].y - 14, pw + 28, ph + 48);
            ctx.restore();
            fe.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, pw, ph, filterKey);
          }
        });
      } else if (layout === 'vom-4' || layout === 'sotay-4') {
        const size = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot && shot.imgElement) fe.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, size, size, filterKey);
        });
      } else if (layout === 'dual-strip-8') {
        // Dual 4-Cut Parallel Strip (2x4)
        const imgW = 660, imgH = 495, startY = 60, gapY = 35;
        for (let i = 0; i < 4; i++) {
          const s1 = shots[i];
          if (s1 && s1.imgElement) fe.drawFilteredImage(ctx, s1.imgElement, 80, startY + i * (imgH + gapY), imgW, imgH, filterKey);

          const s2 = shots[i + 4] || shots[i];
          if (s2 && s2.imgElement) fe.drawFilteredImage(ctx, s2.imgElement, 860, startY + i * (imgH + gapY), imgW, imgH, filterKey);
        }
        // Center Dashed Cut Line
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2, h - 140);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (layout === 'grid-8') {
        const imgW = 660, imgH = 495, startY = 60, gapY = 35;
        for (let i = 0; i < 8; i++) {
          const shot = shots[i] || shots[i % shots.length];
          if (!shot || !shot.imgElement) continue;
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 80 : 860;
          const y = startY + row * (imgH + gapY);
          fe.drawFilteredImage(ctx, shot.imgElement, x, y, imgW, imgH, filterKey);
        }
      } else if (layout === 'sotay-8') {
        const imgW = 760, imgH = 500;
        for (let i = 0; i < 8; i++) {
          const shot = shots[i] || shots[i % shots.length];
          if (!shot || !shot.imgElement) continue;
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 90 : 950;
          const y = 60 + row * 540;
          fe.drawFilteredImage(ctx, shot.imgElement, x, y, imgW, imgH, filterKey);
        }
      }
    }

    drawCaptionsAndDate(ctx, state, w, h) {
      const isDark = ['#0c0c0e', '#181820', '#1c1917'].includes(state.config.stripColor);
      ctx.fillStyle = isDark ? '#fbf8f3' : '#1c1917';
      ctx.textAlign = 'center';
      ctx.font = '800 32px "Be Vietnam Pro", "Playfair Display", sans-serif';

      const safeCaption = (state.config.caption || 'BUỒNG CHỤP ẢNH').toUpperCase();
      ctx.fillText(safeCaption, w / 2, h - 85);

      if (state.config.showDate && !state.customFrameImage) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const mShort = monthsShort[now.getMonth()];
        const yyShort = String(yyyy).slice(-2);
        const style = state.config.dateStyle || 'orange-film';

        if (style === 'orange-film') {
          ctx.font = '700 24px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ea580c';
          ctx.shadowColor = 'rgba(234, 88, 12, 0.45)';
          ctx.shadowBlur = 6;
          const dateStr = `'${yyShort} ${mm} ${dd}  ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          ctx.fillText(dateStr, w / 2, h - 48);
          ctx.shadowBlur = 0;
        } else if (style === 'kpop-star') {
          ctx.font = '800 20px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
          ctx.fillText(`★ ${dd}.${mm}.${yyyy} • 35MM ARCHIVE ★`, w / 2, h - 48);
        } else if (style === 'polaroid') {
          ctx.font = '600 21px "JetBrains Mono", monospace';
          ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
          ctx.fillText(`${mShort} ${dd} '${yyShort} • PHOTOBOOTH`, w / 2, h - 48);
        } else {
          ctx.font = '700 22px "JetBrains Mono", monospace';
          ctx.fillStyle = isDark ? '#d97706' : '#b45309';
          ctx.fillText(`${dd}/${mm}/${yyyy}`, w / 2, h - 48);
        }
      }
    }

    drawStickers(ctx, stickers, w, h) {
      if (!stickers || stickers.length === 0) return;

      stickers.forEach(stk => {
        ctx.save();
        const targetX = stk.x * w;
        const targetY = stk.y * h;

        ctx.translate(targetX, targetY);
        ctx.rotate((stk.rotation || 0) * Math.PI / 180);
        ctx.scale(stk.scale || 1, stk.scale || 1);

        if (stk.type === 'emoji') {
          ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 10;
          ctx.fillText(stk.content, 0, 0);
        } else if (stk.type === 'badge') {
          const padX = 22, padY = 10;
          ctx.font = '800 28px "JetBrains Mono", "Be Vietnam Pro", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const metrics = ctx.measureText(stk.content);
          const badgeW = metrics.width + padX * 2;
          const badgeH = 48;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 12;
          ctx.fillStyle = stk.bg || '#1c1917';
          ctx.beginPath();
          ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
          ctx.fill();

          ctx.strokeStyle = stk.color || '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = stk.color || '#ffffff';
          ctx.fillText(stk.content, 0, 2);
        } else if (stk.type === 'text') {
          const fontMap = {
            'font-serif': '800 42px "Fraunces", "Playfair Display", serif',
            'font-cursive': 'italic 800 42px "Playfair Display", cursive, serif',
            'font-sans': '900 40px "Be Vietnam Pro", sans-serif',
            'font-mono': '700 36px "JetBrains Mono", monospace',
            'font-pixel': '900 38px "JetBrains Mono", monospace'
          };
          ctx.font = fontMap[stk.font] || fontMap['font-sans'];
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.strokeStyle = (stk.color === '#ffffff' || stk.color === '#fff') ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 6;
          ctx.strokeText(stk.content, 0, 0);

          ctx.fillStyle = stk.color || '#ffffff';
          ctx.fillText(stk.content, 0, 0);
        }

        ctx.restore();
      });
    }
  }

  window.FrameRenderer = FrameRenderer;
  window.frameRenderer = new FrameRenderer();
})(window);
