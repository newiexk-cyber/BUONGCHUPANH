/**
 * VINTAGE FILM PHOTO BOOTH CONTROLLER
 * Tích hợp 10 cuộn phim huyền thoại (Kodak, Fuji, CineStill, Ilford, Polaroid, Leica) có REALTIME PREVIEW TRỰC TIẾP
 * Bộ sưu tập khung TemplatesBooth & Canva Hot Trend 2026
 */

(function(window) {
  class VintageBoothApp {
    constructor() {
      this.videoEl = document.getElementById('boothVideo');
      this.stripCanvas = document.getElementById('stripCanvas');
      this.stripCtx = this.stripCanvas.getContext('2d');
      this.countdownOverlay = document.getElementById('countdownOverlay');
      this.countdownNumber = document.getElementById('countdownNumber');
      this.hudFilmStock = document.getElementById('hudFilmStock');

      this.capturedShots = [];
      this.isShooting = false;

      this.state = {
        selectedFilter: 'kodak-portra',
        grainIntensity: 35,
        lightLeak: true,
        frameLayout: 'strip',
        frameColor: '#ffffff',
        selectedCutePreset: 'none',
        customCanvaFrame: null,
        customText: 'VINTAGE PHOTOBOOTH',
        showDate: true
      };
    }

    async init() {
      this.bindEvents();
      if (window.cameraManager) {
        await window.cameraManager.startWebcam(this.videoEl);
        await this.refreshCameraDevices();

        // Áp dụng Live Filter Preview ngay khi camera sẵn sàng
        this.applyLiveViewfinderFilter(this.state.selectedFilter);

        window.cameraManager.subscribe((camState) => {
          const label = document.getElementById('tetherStatusLabel');
          if (label) {
            label.innerText = camState.connected ? camState.deviceName : 'Chế độ Demo';
          }
          this.refreshCameraDevices();
        });

        window.cameraManager.onPhotoReceived = (blob) => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            if (this.capturedShots.length < 4) {
              this.capturedShots.push({ imgElement: img, dataUrl: url });
              this.updateThumbnails();
              if (this.capturedShots.length === 4) {
                this.showEditorView();
              }
            }
          };
          img.src = url;
        };
      }
    }

    async refreshCameraDevices() {
      const select = document.getElementById('cameraSourceSelect');
      if (!select || !window.cameraManager) return;

      const devices = await window.cameraManager.getAvailableVideoDevices();
      select.innerHTML = '';

      if (devices.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerText = '📷 Sony A7 IV / Webcam Studio';
        select.appendChild(opt);
        return;
      }

      devices.forEach((dev, idx) => {
        const opt = document.createElement('option');
        opt.value = dev.deviceId;
        const name = dev.label || `Camera ${idx + 1}`;
        opt.innerText = `🎥 ${name}`;
        if (dev.label.toLowerCase().includes('sony') || dev.label.toLowerCase().includes('ilce') || dev.label.toLowerCase().includes('cam link') || dev.label.toLowerCase().includes('usb video')) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    /**
     * Áp dụng Realtime Live Filter trên khung hình camera TRƯỚC KHI CHỤP
     */
    applyLiveViewfinderFilter(filterType) {
      if (!this.videoEl) return;

      const filters = {
        'kodak-portra': 'sepia(0.2) saturate(1.18) contrast(1.06) brightness(1.04)',
        'fuji-superia': 'hue-rotate(-15deg) saturate(1.12) contrast(1.1) brightness(1.02)',
        'cinestill-800t': 'hue-rotate(25deg) saturate(1.3) contrast(1.18) brightness(0.96)',
        'kodak-gold': 'sepia(0.35) saturate(1.32) contrast(1.12) brightness(1.05)',
        'ilford-hp5': 'grayscale(1) contrast(1.38) brightness(1.02)',
        'polaroid-600': 'sepia(0.22) saturate(0.88) contrast(0.96) brightness(1.08)',
        'kodachrome-64': 'contrast(1.28) saturate(1.42) brightness(0.98)',
        'leica-mono': 'grayscale(1) contrast(1.55) brightness(0.92)',
        'fuji-velvia': 'saturate(1.65) contrast(1.22) brightness(1.02)',
        'normal': 'none'
      };

      this.videoEl.style.filter = filters[filterType] || 'none';
      this.videoEl.style.transition = 'filter 200ms ease';
    }

    async startFourShotSequence() {
      if (this.isShooting) return;
      this.isShooting = true;
      this.capturedShots = [];
      this.updateThumbnails();
      document.getElementById('btnStartSequence').disabled = true;

      for (let shotIndex = 1; shotIndex <= 4; shotIndex++) {
        for (let sec = 3; sec >= 1; sec--) {
          this.showCountdown(sec, shotIndex);
          if (window.audioEffects) window.audioEffects.playBeep(sec === 1);
          await this.sleep(1000);
        }

        this.hideCountdown();

        this.triggerFlash();
        if (window.audioEffects) window.audioEffects.playShutter();

        if (window.cameraManager) {
          const snapshot = await window.cameraManager.captureFrame();
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = snapshot.dataUrl;
          });

          this.capturedShots.push({
            imgElement: img,
            dataUrl: snapshot.dataUrl,
            index: shotIndex
          });

          this.updateThumbnails();
        }

        if (shotIndex < 4) {
          await this.sleep(1200);
        }
      }

      if (window.audioEffects) window.audioEffects.playMotorAdvance();
      this.isShooting = false;
      document.getElementById('btnStartSequence').disabled = false;

      this.showEditorView();
    }

    showCountdown(sec, shotNum) {
      this.countdownOverlay.style.display = 'flex';
      this.countdownNumber.innerText = sec;
      document.getElementById('countdownCaption').innerText = `TẤM ${shotNum} / 4`;
    }

    hideCountdown() {
      this.countdownOverlay.style.display = 'none';
    }

    triggerFlash() {
      const flash = document.getElementById('screenFlash');
      if (flash) {
        flash.classList.remove('flash-active');
        void flash.offsetWidth;
        flash.classList.add('flash-active');
      }
    }

    updateThumbnails() {
      for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const shot = this.capturedShots[i - 1];
        if (shot) {
          slot.classList.add('filled');
          slot.innerHTML = `
            <img src="${shot.dataUrl}" alt="Shot ${i}">
            <span class="shot-slot-badge">#0${i}</span>
          `;
        } else {
          slot.classList.remove('filled');
          slot.innerHTML = `<span style="font-family: var(--font-mono); font-size: 0.75rem;">SHOT ${i}</span>`;
        }
      }
    }

    showEditorView() {
      document.getElementById('boothLivePanel').style.display = 'none';
      document.getElementById('boothEditPanel').style.display = 'block';
      this.renderStripPipeline();
    }

    showLiveView() {
      document.getElementById('boothLivePanel').style.display = 'block';
      document.getElementById('boothEditPanel').style.display = 'none';
    }

    renderStripPipeline() {
      if (this.capturedShots.length < 4) return;

      if (this.state.frameLayout === 'strip') {
        this.renderVerticalStrip();
      } else {
        this.renderSquareGrid();
      }
    }

    renderVerticalStrip() {
      const stripWidth = 800;
      const stripHeight = 2400;

      this.stripCanvas.width = stripWidth;
      this.stripCanvas.height = stripHeight;
      const ctx = this.stripCtx;

      // Nền khung
      let bgCol = this.state.frameColor;
      if (this.state.selectedCutePreset === 'coquette-ribbon') bgCol = '#fff1f2';
      if (this.state.selectedCutePreset === 'butter-tulip') bgCol = '#fefce8';
      if (this.state.selectedCutePreset === 'mochi-cat') bgCol = '#f5f3ff';
      if (this.state.selectedCutePreset === 'y2k-cyber') bgCol = '#18181b';
      if (this.state.selectedCutePreset === 'vintage-stamp') bgCol = '#fef3c7';
      if (this.state.selectedCutePreset === 'birthday-party') bgCol = '#0f172a';
      if (this.state.selectedCutePreset === 'modern-wedding') bgCol = '#f8fafc';
      if (this.state.selectedCutePreset === 'sakura-spring') bgCol = '#fff5f5';

      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, stripWidth, stripHeight);

      // Kích thước 4 ảnh
      const imgW = 680;
      const imgH = 510;
      const paddingX = 60;
      const startY = 60;
      const gapY = 40;

      this.capturedShots.forEach((shot, idx) => {
        const y = startY + idx * (imgH + gapY);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgW;
        tempCanvas.height = imgH;
        const tCtx = tempCanvas.getContext('2d');

        const sw = shot.imgElement.width;
        const sh = shot.imgElement.height;
        const aspect = 4 / 3;
        let cw = sw, ch = sw / aspect, cx = 0, cy = (sh - ch) / 2;
        if (ch > sh) {
          ch = sh; cw = sh * aspect; cy = 0; cx = (sw - cw) / 2;
        }

        tCtx.drawImage(shot.imgElement, cx, cy, cw, ch, 0, 0, imgW, imgH);
        this.applyFilterToCanvas(tempCanvas, this.state.selectedFilter, this.state.grainIntensity);

        ctx.drawImage(tempCanvas, paddingX, y, imgW, imgH);

        // Viền ảnh
        if (this.state.selectedCutePreset !== 'vintage-stamp') {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 2;
          ctx.strokeRect(paddingX, y, imgW, imgH);
        }
      });

      // Vẽ Presets Canva / TemplatesBooth hoặc Khung Custom
      if (this.state.customCanvaFrame) {
        ctx.drawImage(this.state.customCanvaFrame, 0, 0, stripWidth, stripHeight);
      } else if (this.state.selectedCutePreset === 'coquette-ribbon') {
        this.drawCoquetteRibbonDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'butter-tulip') {
        this.drawButterTulipDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'mochi-cat') {
        this.drawMochiCatDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'y2k-cyber') {
        this.drawY2KCyberDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY, paddingX, imgW);
      } else if (this.state.selectedCutePreset === 'vintage-stamp') {
        this.drawVintageStampDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'birthday-party') {
        this.drawBirthdayPartyDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'modern-wedding') {
        this.drawModernWeddingDecorations(ctx, stripWidth, stripHeight, startY, imgH, gapY);
      } else if (this.state.selectedCutePreset === 'sakura-spring') {
        this.drawSakuraSpringDecorations(ctx, stripWidth, stripHeight);
      }

      // Header & Footer dải ảnh
      if (!this.state.customCanvaFrame) {
        const isDarkFrame = this.isColorDark(bgCol);
        ctx.fillStyle = isDarkFrame ? '#f8fafc' : '#1e293b';
        ctx.textAlign = 'center';

        ctx.font = 'bold 28px "Outfit", sans-serif';
        ctx.fillText(this.state.customText.toUpperCase(), stripWidth / 2, stripHeight - 90);

        if (this.state.showDate) {
          ctx.font = '500 18px "JetBrains Mono", monospace';
          ctx.fillStyle = isDarkFrame ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
          const now = new Date();
          const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} • LIFE4CUTS`;
          ctx.fillText(dateStr, stripWidth / 2, stripHeight - 55);
        }
      }
    }

    renderSquareGrid() {
      const size = 1600;
      this.stripCanvas.width = size;
      this.stripCanvas.height = size;
      const ctx = this.stripCtx;

      let bgCol = this.state.frameColor;
      if (this.state.selectedCutePreset === 'coquette-ribbon') bgCol = '#fff1f2';
      if (this.state.selectedCutePreset === 'butter-tulip') bgCol = '#fefce8';
      if (this.state.selectedCutePreset === 'mochi-cat') bgCol = '#f5f3ff';
      if (this.state.selectedCutePreset === 'y2k-cyber') bgCol = '#18181b';
      if (this.state.selectedCutePreset === 'vintage-stamp') bgCol = '#fef3c7';
      if (this.state.selectedCutePreset === 'birthday-party') bgCol = '#0f172a';
      if (this.state.selectedCutePreset === 'modern-wedding') bgCol = '#f8fafc';
      if (this.state.selectedCutePreset === 'sakura-spring') bgCol = '#fff5f5';

      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, size, size);

      const imgSize = 680;
      const positions = [
        { x: 80, y: 80 },
        { x: 840, y: 80 },
        { x: 80, y: 800 },
        { x: 840, y: 800 }
      ];

      this.capturedShots.forEach((shot, idx) => {
        const pos = positions[idx];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgSize;
        tempCanvas.height = imgSize;
        const tCtx = tempCanvas.getContext('2d');

        const sw = shot.imgElement.width;
        const sh = shot.imgElement.height;
        const minDim = Math.min(sw, sh);
        tCtx.drawImage(shot.imgElement, (sw - minDim) / 2, (sh - minDim) / 2, minDim, minDim, 0, 0, imgSize, imgSize);
        this.applyFilterToCanvas(tempCanvas, this.state.selectedFilter, this.state.grainIntensity);

        ctx.drawImage(tempCanvas, pos.x, pos.y, imgSize, imgSize);
      });

      if (this.state.customCanvaFrame) {
        ctx.drawImage(this.state.customCanvaFrame, 0, 0, size, size);
      } else {
        const isDark = this.isColorDark(bgCol);
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.fillText(this.state.customText.toUpperCase(), size / 2, size - 30);
      }
    }

    /* -------------------------------------------------------------
       VECTOR TEMPLATESBOOTH & CANVA DESIGNS
       ------------------------------------------------------------- */

    drawCoquetteRibbonDecorations(ctx, w, h, startY, imgH, gapY) {
      this.drawCuteBow(ctx, 60, 45, '#f43f5e');
      this.drawCuteBow(ctx, w - 60, 45, '#f43f5e');
      this.drawCuteBow(ctx, 60, h - 140, '#f43f5e');
      this.drawCuteBow(ctx, w - 60, h - 140, '#f43f5e');

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const midY = startY + (i + 1) * imgH + i * gapY + gapY / 2;
        this.drawCuteBow(ctx, w / 2, midY, '#fb7185');
        for (let x = 120; x < w - 120; x += 30) {
          if (Math.abs(x - w / 2) > 40) {
            ctx.beginPath();
            ctx.arc(x, midY, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    drawButterTulipDecorations(ctx, w, h, startY, imgH, gapY) {
      this.drawCuteBearHead(ctx, w / 2, 42);
      for (let y = 180; y < h - 200; y += 280) {
        this.drawCuteTulip(ctx, 30, y, '#ef4444');
        this.drawCuteTulip(ctx, w - 30, y + 140, '#f43f5e');
        this.drawSparkle(ctx, 30, y + 140, '#f59e0b');
        this.drawSparkle(ctx, w - 30, y, '#f59e0b');
      }
    }

    drawMochiCatDecorations(ctx, w, h, startY, imgH, gapY) {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 80, 50); ctx.lineTo(w / 2 - 50, 15); ctx.lineTo(w / 2 - 20, 50); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w / 2 + 20, 50); ctx.lineTo(w / 2 + 50, 15); ctx.lineTo(w / 2 + 80, 50); ctx.fill();

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 70, 46); ctx.lineTo(w / 2 - 50, 24); ctx.lineTo(w / 2 - 30, 46); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w / 2 + 30, 46); ctx.lineTo(w / 2 + 50, 24); ctx.lineTo(w / 2 + 70, 46); ctx.fill();

      for (let y = 140; y < h - 180; y += 240) {
        this.drawCatPaw(ctx, 32, y, '#a855f7');
        this.drawCatPaw(ctx, w - 32, y + 120, '#ec4899');
      }
    }

    drawY2KCyberDecorations(ctx, w, h, startY, imgH, gapY, padX, imgW) {
      for (let i = 0; i < 4; i++) {
        const y = startY + i * (imgH + gapY);
        this.drawTape(ctx, padX - 10, y - 5, -25, 'rgba(253, 224, 71, 0.7)');
        this.drawTape(ctx, padX + imgW - 35, y - 5, 25, 'rgba(244, 114, 182, 0.7)');
      }

      this.drawCyberCrossStar(ctx, 35, 120, 22, '#38bdf8');
      this.drawCyberCrossStar(ctx, w - 35, 300, 22, '#f43f5e');
      this.drawCyberCrossStar(ctx, 35, 800, 22, '#a855f7');
      this.drawCyberCrossStar(ctx, w - 35, 1400, 22, '#38bdf8');
    }

    drawVintageStampDecorations(ctx, w, h, startY, imgH, gapY) {
      ctx.fillStyle = '#451a03';
      for (let y = 30; y < h - 40; y += 50) {
        ctx.fillRect(16, y, 18, 26);
        ctx.fillRect(w - 34, y, 18, 26);
      }
      this.drawPostalRubberStamp(ctx, w - 80, 75, 'POSTAL AIR MAIL');
      this.drawPostalRubberStamp(ctx, 80, h - 140, 'RETRO LAB • 1990');
    }

    // TemplatesBooth: Birthday Party Glitz
    drawBirthdayPartyDecorations(ctx, w, h, startY, imgH, gapY) {
      // Bóng bay party lấp lánh ở các góc
      this.drawBalloon(ctx, 45, 60, '#f59e0b');
      this.drawBalloon(ctx, w - 45, 60, '#ec4899');
      this.drawBalloon(ctx, 45, h - 150, '#3b82f6');
      this.drawBalloon(ctx, w - 45, h - 150, '#10b981');

      // Pháo hoa kim tuyến vàng kim
      for (let y = 160; y < h - 180; y += 220) {
        this.drawSparkle(ctx, 30, y, '#fbbf24');
        this.drawSparkle(ctx, w - 30, y + 100, '#fbbf24');
      }
    }

    // TemplatesBooth: Minimalist Botanical Wedding
    drawModernWeddingDecorations(ctx, w, h, startY, imgH, gapY) {
      // Nhánh lá bạch đàn eucalyptus thanh lịch
      this.drawEucalyptusBranch(ctx, 45, 45, 1);
      this.drawEucalyptusBranch(ctx, w - 45, 45, -1);
      this.drawEucalyptusBranch(ctx, 45, h - 140, 1);
      this.drawEucalyptusBranch(ctx, w - 45, h - 140, -1);

      // Viền vàng kim tinh tế quanh 4 ảnh
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const y = startY + i * (imgH + gapY);
        ctx.strokeRect(55, y - 5, 690, imgH + 10);
      }
    }

    drawSakuraSpringDecorations(ctx, w, h) {
      for (let y = 80; y < h - 150; y += 220) {
        this.drawSakuraFlower(ctx, 35, y, 20);
        this.drawSakuraFlower(ctx, w - 35, y + 110, 20);
        this.drawSakuraPetal(ctx, 38, y + 70, 15);
        this.drawSakuraPetal(ctx, w - 38, y + 180, -20);
      }
    }

    /* -------------------------------------------------------------
       VECTOR DRAWING HELPERS
       ------------------------------------------------------------- */

    drawCuteBow(ctx, x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x - 22, y - 10); ctx.lineTo(x - 22, y + 10); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + 22, y - 10); ctx.lineTo(x + 22, y + 10); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawCuteBearHead(ctx, x, y) {
      ctx.save();
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.arc(x - 24, y - 16, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 24, y - 16, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.beginPath(); ctx.arc(x - 14, y + 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 14, y + 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(x - 9, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 9, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(x, y + 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawCuteTulip(ctx, x, y, color) {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y + 15, x, y + 30); ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.ellipse(x + 6, y + 18, 8, 4, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y - 5, 12, 0, Math.PI);
      ctx.lineTo(x - 12, y - 16); ctx.lineTo(x - 4, y - 9); ctx.lineTo(x, y - 18);
      ctx.lineTo(x + 4, y - 9); ctx.lineTo(x + 12, y - 16); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    drawCatPaw(ctx, x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 9, y - 7, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 10, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 9, y - 7, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawTape(ctx, x, y, angleDeg, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.fillStyle = color;
      ctx.fillRect(-25, -8, 50, 16);
      ctx.restore();
    }

    drawCyberCrossStar(ctx, x, y, size, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.quadraticCurveTo(x, y, x + size, y);
      ctx.quadraticCurveTo(x, y, x, y + size);
      ctx.quadraticCurveTo(x, y, x - size, y);
      ctx.quadraticCurveTo(x, y, x, y - size);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    drawPostalRubberStamp(ctx, x, y, text) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.25);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, 0, 4);
      ctx.restore();
    }

    drawBalloon(ctx, x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(x, y, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x - 5, y + 35); ctx.stroke();
      ctx.restore();
    }

    drawEucalyptusBranch(ctx, x, y, dir) {
      ctx.save();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10 * dir, y + 25, x, y + 50); ctx.stroke();
      ctx.fillStyle = '#10b981';
      for (let i = 10; i < 45; i += 12) {
        ctx.beginPath(); ctx.ellipse(x + 8 * dir, y + i, 8, 5, 0.3 * dir, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    drawSakuraFlower(ctx, x, y, size) {
      ctx.save();
      ctx.fillStyle = '#fda4af';
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * (size / 2), y + Math.sin(angle) * (size / 2), size / 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawSakuraPetal(ctx, x, y, rotDeg) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawSparkle(ctx, x, y, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - 10); ctx.quadraticCurveTo(x, y, x + 10, y);
      ctx.quadraticCurveTo(x, y, x, y + 10); ctx.quadraticCurveTo(x, y, x - 10, y);
      ctx.quadraticCurveTo(x, y, x, y - 10); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /**
     * Thuật toán Color Grading chính xác cho 10 cuộn phim huyền thoại
     */
    applyFilterToCanvas(canvas, filterType, grainAmount = 30) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const grainFactor = (grainAmount / 100) * 35;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Kodak Portra 400 (Tông da ấm tự nhiên, màu vàng mật ong)
        if (filterType === 'kodak-portra') {
          r = r * 1.14 + 14;
          g = g * 1.03 + 6;
          b = b * 0.86 - 4;
        } 
        // 2. Fujifilm Superia 400 (Xanh ngọc lục bảo tươi mát)
        else if (filterType === 'fuji-superia') {
          r = r * 0.90;
          g = g * 1.10 + 10;
          b = b * 1.06 + 8;
        } 
        // 3. CineStill 800T (Ánh xanh Hollywood & vệt đỏ ấm)
        else if (filterType === 'cinestill-800t') {
          r = r * 0.92;
          g = g * 1.05 + 5;
          b = b * 1.25 + 18;
        } 
        // 4. Kodak Gold 200 (Sắc nắng rực rỡ retro 90s)
        else if (filterType === 'kodak-gold') {
          r = r * 1.22 + 18;
          g = g * 1.08 + 10;
          b = b * 0.80 - 8;
        } 
        // 5. Ilford HP5 Plus 400 (Đen trắng cổ điển có chiều sâu)
        else if (filterType === 'ilford-hp5') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray * 1.15 - 12;
          g = gray * 1.15 - 12;
          b = gray * 1.15 - 12;
        } 
        // 6. Polaroid 600 Vintage (Màu ảnh lấy liền phai mờ)
        else if (filterType === 'polaroid-600') {
          r = r * 1.05 + 15;
          g = g * 0.98 + 10;
          b = b * 0.92 + 20;
        } 
        // 7. Kodachrome 64 (Màu đỏ/vàng rực rỡ 80s)
        else if (filterType === 'kodachrome-64') {
          r = r * 1.30 + 12;
          g = g * 0.95;
          b = b * 0.85;
        } 
        // 8. Leica Monochrome (Đen trắng tương phản cao cấp)
        else if (filterType === 'leica-mono') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray * 1.35 - 30;
          g = gray * 1.35 - 30;
          b = gray * 1.35 - 30;
        } 
        // 9. Fuji Velvia 50 (Siêu bão hòa rực rỡ)
        else if (filterType === 'fuji-velvia') {
          r = r * 1.25;
          g = g * 1.15;
          b = b * 1.20;
        }

        // Tạo hạt phim Analog Grain
        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainFactor;
          r += noise;
          g += noise;
          b += noise;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);

      // CineStill Halation Glow hoặc Vintage Light Leak
      if (this.state.lightLeak && !filterType.includes('mono') && filterType !== 'ilford-hp5') {
        const grad = ctx.createRadialGradient(w * 0.9, 0, 10, w * 0.9, 0, w * 0.7);
        if (filterType === 'cinestill-800t') {
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
          grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
        } else {
          grad.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
          grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.15)');
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    isColorDark(hex) {
      if (hex === '#ffffff' || hex === '#fce7f3' || hex === '#fff1f2' || hex === '#ffe4e6' || hex === '#fefce8' || hex === '#f5f3ff' || hex === '#fff5f5' || hex === '#f8fafc') return false;
      return true;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async exportPtbProject() {
      if (this.capturedShots.length < 4) return;

      const data = {
        mode: 'vintage-booth',
        title: 'Vintage 4-Cut Strip Session',
        canvas: { width: this.stripCanvas.width, height: this.stripCanvas.height, dpi: 300 },
        settings: this.state,
        originalImages: this.capturedShots.map((shot, idx) => ({
          name: `shot_${idx + 1}.jpg`,
          dataUrl: shot.dataUrl
        })),
        processedDataUrl: this.stripCanvas.toDataURL('image/jpeg', 0.95)
      };

      if (window.PtbPackager) {
        await window.PtbPackager.exportProject(data, 'vintage-4cut-session.ptb');
      }
    }

    downloadPhotoStrip() {
      const a = document.createElement('a');
      a.href = this.stripCanvas.toDataURL('image/jpeg', 0.95);
      a.download = `vintage-photo-strip-${Date.now()}.jpg`;
      a.click();
    }

    bindEvents() {
      document.getElementById('btnStartSequence').addEventListener('click', () => this.startFourShotSequence());
      document.getElementById('btnRetakeAll').addEventListener('click', () => this.showLiveView());

      const uploadInput = document.getElementById('uploadVintageInput');
      if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          if (files.length === 0) return;

          this.capturedShots = [];
          for (let i = 0; i < Math.min(4, files.length); i++) {
            const file = files[i];
            const dataUrl = await new Promise((res) => {
              const reader = new FileReader();
              reader.onload = (ev) => res(ev.target.result);
              reader.readAsDataURL(file);
            });

            const img = new Image();
            await new Promise((res) => {
              img.onload = res;
              img.src = dataUrl;
            });

            this.capturedShots.push({ imgElement: img, dataUrl, index: i + 1 });
          }

          while (this.capturedShots.length < 4 && this.capturedShots.length > 0) {
            const clone = { ...this.capturedShots[0], index: this.capturedShots.length + 1 };
            this.capturedShots.push(clone);
          }

          this.updateThumbnails();
          this.showEditorView();
        });
      }

      // Bộ lọc cuộn phim máy ảnh (Realtime Live Preview)
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.selectedFilter = btn.dataset.filter;

          // Cập nhật Realtime Preview ngay trên màn hình camera
          this.applyLiveViewfinderFilter(this.state.selectedFilter);

          // Cập nhật tên cuộn phim trên Viewfinder HUD
          if (this.hudFilmStock && btn.dataset.film) {
            this.hudFilmStock.innerText = btn.dataset.film;
          }

          this.renderStripPipeline();
        });
      });

      // Mẫu khung dễ thương có sẵn (TemplatesBooth & Canva Presets)
      document.querySelectorAll('.cute-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.cute-preset-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'var(--border-subtle)';
          });
          btn.classList.add('active');
          btn.style.borderColor = 'var(--accent-rose)';
          this.state.selectedCutePreset = btn.dataset.preset;
          this.state.customCanvaFrame = null;
          const status = document.getElementById('customFrameStatus');
          if (status) status.style.display = 'none';
          this.renderStripPipeline();
        });
      });

      // Chọn màu viền khung
      document.querySelectorAll('.frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.frameColor = btn.dataset.color;
          this.renderStripPipeline();
        });
      });

      // Upload Khung PNG Custom từ Canva
      const canvaInput = document.getElementById('uploadCanvaFrameInput');
      if (canvaInput) {
        canvaInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              this.state.customCanvaFrame = img;
              const status = document.getElementById('customFrameStatus');
              if (status) {
                status.style.display = 'block';
                status.innerText = `✓ Đã nạp khung Canva: ${file.name}`;
              }
              this.renderStripPipeline();
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      // Chọn layout dải dọc / lưới vuông
      document.querySelectorAll('.layout-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.layout-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.frameLayout = btn.dataset.layout;
          this.renderStripPipeline();
        });
      });

      const customTextInput = document.getElementById('customTextInput');
      if (customTextInput) {
        customTextInput.addEventListener('input', (e) => {
          this.state.customText = e.target.value;
          this.renderStripPipeline();
        });
      }

      const grainSlider = document.getElementById('grainSlider');
      if (grainSlider) {
        grainSlider.addEventListener('input', (e) => {
          this.state.grainIntensity = parseInt(e.target.value, 10);
          document.getElementById('grainVal').innerText = `${this.state.grainIntensity}%`;
          this.renderStripPipeline();
        });
      }

      // Chuyển đổi thiết bị camera / Sony A7 IV
      const camSelect = document.getElementById('cameraSourceSelect');
      if (camSelect) {
        camSelect.addEventListener('change', async (e) => {
          const deviceId = e.target.value;
          if (window.cameraManager) {
            await window.cameraManager.startWebcam(this.videoEl, deviceId);
            this.applyLiveViewfinderFilter(this.state.selectedFilter);
          }
        });
      }

      document.getElementById('btnDownloadStrip').addEventListener('click', () => this.downloadPhotoStrip());
      document.getElementById('btnSaveStripPtb').addEventListener('click', () => this.exportPtbProject());
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new VintageBoothApp();
    app.init();
  });
})(window);
