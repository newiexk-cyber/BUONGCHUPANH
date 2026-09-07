/**
 * ID PHOTO STUDIO CONTROLLER
 * Quản lý toàn bộ luồng chụp ảnh thẻ, tách nền, ghép áo sơ mi và dàn layout in 10x15cm
 */

(function(window) {
  class IdPhotoApp {
    constructor() {
      this.videoEl = document.getElementById('cameraVideo');
      this.canvasEl = document.getElementById('photoCanvas');
      this.ctx = this.canvasEl.getContext('2d');
      this.ghostOverlay = document.getElementById('ghostOverlay');
      this.postureBanner = document.getElementById('postureBanner');
      this.postureText = document.getElementById('postureText');

      this.rawCapturedImage = null;
      this.processedCanvas = null;

      this.state = {
        isLive: true,
        selectedBg: 'blue',
        skinSmooth: 35,
        brightness: 10,
        selectedSuit: 'none',
        suitScale: 1.0,
        suitOffsetY: 0,
        suitOffsetX: 0,
        targetRatio: '3x4'
      };

      this.postureInterval = null;
    }

    async init() {
      this.bindEvents();
      await this.startLiveCamera();
      this.startPostureDetectionLoop();
    }

    async startLiveCamera() {
      this.state.isLive = true;
      this.videoEl.style.display = 'block';
      this.canvasEl.style.display = 'none';
      this.ghostOverlay.style.display = 'flex';
      document.getElementById('liveControls').style.display = 'flex';
      document.getElementById('editControls').style.display = 'none';

      if (window.cameraManager) {
        await window.cameraManager.startWebcam(this.videoEl);

        window.cameraManager.onPhotoReceived = (blob) => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            this.handleCaptureComplete(img);
          };
          img.src = url;
        };
      }
    }

    startPostureDetectionLoop() {
      if (this.postureInterval) clearInterval(this.postureInterval);

      this.postureInterval = setInterval(() => {
        if (!this.state.isLive || !this.videoEl || this.videoEl.paused) return;

        if (window.postureChecker) {
          const result = window.postureChecker.analyze(this.videoEl);
          if (result.isAligned) {
            this.ghostOverlay.className = 'ghost-overlay aligned';
            this.postureBanner.className = 'posture-banner success';
          } else {
            this.ghostOverlay.className = 'ghost-overlay warning';
            this.postureBanner.className = 'posture-banner warning';
          }
          this.postureText.innerText = result.warnings[0] || 'Giữ tư thế chuẩn';
        }
      }, 400);
    }

    async capture() {
      if (window.audioEffects) window.audioEffects.playShutter();
      this.triggerFlash();

      if (window.cameraManager) {
        const snapshot = await window.cameraManager.captureFrame();
        const img = new Image();
        img.onload = () => {
          this.handleCaptureComplete(img);
        };
        img.src = snapshot.dataUrl;
      }
    }

    triggerFlash() {
      const flash = document.getElementById('screenFlash');
      if (flash) {
        flash.classList.remove('flash-active');
        void flash.offsetWidth;
        flash.classList.add('flash-active');
      }
    }

    handleCaptureComplete(imageElement) {
      this.rawCapturedImage = imageElement;
      this.state.isLive = false;
      this.videoEl.style.display = 'none';
      this.canvasEl.style.display = 'block';
      this.ghostOverlay.style.display = 'none';
      document.getElementById('liveControls').style.display = 'none';
      document.getElementById('editControls').style.display = 'flex';

      this.renderPhotoPipeline();
    }

    renderPhotoPipeline() {
      if (!this.rawCapturedImage) return;

      const targetWidth = 1200;
      const targetHeight = 1600;

      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = targetWidth;
      baseCanvas.height = targetHeight;
      const bCtx = baseCanvas.getContext('2d');

      const imgRatio = this.rawCapturedImage.width / this.rawCapturedImage.height;
      let sW, sH, sX, sY;
      if (imgRatio > 3 / 4) {
        sH = this.rawCapturedImage.height;
        sW = sH * (3 / 4);
        sX = (this.rawCapturedImage.width - sW) / 2;
        sY = 0;
      } else {
        sW = this.rawCapturedImage.width;
        sH = sW * (4 / 3);
        sX = 0;
        sY = (this.rawCapturedImage.height - sH) / 2;
      }

      bCtx.drawImage(this.rawCapturedImage, sX, sY, sW, sH, 0, 0, targetWidth, targetHeight);

      let step1Canvas = baseCanvas;
      if (window.BackgroundRemover) {
        step1Canvas = window.BackgroundRemover.processBackground(baseCanvas, this.state.selectedBg, 40);
      }

      let step2Canvas = step1Canvas;
      if (window.BackgroundRemover) {
        step2Canvas = window.BackgroundRemover.applySkinRetouch(step1Canvas, this.state.skinSmooth, this.state.brightness);
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const fCtx = finalCanvas.getContext('2d');

      fCtx.drawImage(step2Canvas, 0, 0);

      if (this.state.selectedSuit !== 'none' && window.suitInpaintEngine) {
        const suitCanvas = window.suitInpaintEngine.generateSuitCanvas(this.state.selectedSuit, targetWidth * 1.1, targetHeight * 0.75);
        const suitW = suitCanvas.width * this.state.suitScale;
        const suitH = suitCanvas.height * this.state.suitScale;
        const suitX = (targetWidth - suitW) / 2 + this.state.suitOffsetX;
        const suitY = targetHeight - suitH * 0.75 + this.state.suitOffsetY;

        fCtx.drawImage(suitCanvas, suitX, suitY, suitW, suitH);
      }

      this.processedCanvas = finalCanvas;

      this.canvasEl.width = targetWidth;
      this.canvasEl.height = targetHeight;
      this.ctx.clearRect(0, 0, targetWidth, targetHeight);
      this.ctx.drawImage(finalCanvas, 0, 0);
    }

    generatePrintSheet() {
      if (!this.processedCanvas) return null;

      const sheetCanvas = document.createElement('canvas');
      const sheetW = 1200;
      const sheetH = 1800;
      sheetCanvas.width = sheetW;
      sheetCanvas.height = sheetH;
      const ctx = sheetCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sheetW, sheetH);

      const pW = 354;
      const pH = 472;

      const positions = [
        { x: 180, y: 320 },
        { x: 666, y: 320 },
        { x: 180, y: 920 },
        { x: 666, y: 920 }
      ];

      positions.forEach((pos) => {
        ctx.drawImage(this.processedCanvas, pos.x, pos.y, pW, pH);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, pW, pH);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const m = 12;
        ctx.beginPath(); ctx.moveTo(pos.x - m, pos.y); ctx.lineTo(pos.x - 2, pos.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y - m); ctx.lineTo(pos.x, pos.y - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x + pW + 2, pos.y); ctx.lineTo(pos.x + pW + m, pos.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x + pW, pos.y - m); ctx.lineTo(pos.x + pW, pos.y - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x - m, pos.y + pH); ctx.lineTo(pos.x - 2, pos.y + pH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y + pH + 2); ctx.lineTo(pos.x, pos.y + pH + m); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x + pW + 2, pos.y + pH); ctx.lineTo(pos.x + pW + m, pos.y + pH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x + pW, pos.y + pH + 2); ctx.lineTo(pos.x + pW, pos.y + pH + m); ctx.stroke();
      });

      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ONLINE PHOTO BOOTH STUDIO - KHỔ IN 10x15 CM (4 ẢNH 3x4 CM)', sheetW / 2, sheetH - 80);

      return sheetCanvas;
    }

    async exportPtbProject() {
      if (!this.rawCapturedImage || !this.processedCanvas) return;

      const data = {
        mode: 'id-photo',
        title: 'Ảnh Thẻ Hành Chính Standard',
        canvas: { width: 1200, height: 1600, dpi: 300 },
        settings: this.state,
        originalImages: [{ name: 'raw_capture.jpg', dataUrl: this.rawCapturedImage.src }],
        processedDataUrl: this.processedCanvas.toDataURL('image/jpeg', 0.95)
      };

      if (window.PtbPackager) {
        await window.PtbPackager.exportProject(data, 'anh-the-hanh-chinh.ptb');
      }
    }

    downloadSinglePhoto() {
      if (!this.processedCanvas) return;
      const a = document.createElement('a');
      a.href = this.processedCanvas.toDataURL('image/jpeg', 0.95);
      a.download = `anh-the-${this.state.targetRatio}.jpg`;
      a.click();
    }

    downloadPrintSheet() {
      const sheet = this.generatePrintSheet();
      if (!sheet) return;
      const a = document.createElement('a');
      a.href = sheet.toDataURL('image/jpeg', 0.98);
      a.download = 'layout-in-10x15cm-4-anh-3x4.jpg';
      a.click();
    }

    bindEvents() {
      document.getElementById('btnCapture').addEventListener('click', () => this.capture());
      document.getElementById('btnRetake').addEventListener('click', () => this.startLiveCamera());

      const fileUpload = document.getElementById('uploadInput');
      if (fileUpload) {
        fileUpload.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => this.handleCaptureComplete(img);
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.selectedBg = btn.dataset.bg;
          this.renderPhotoPipeline();
        });
      });

      document.querySelectorAll('.suit-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.suit-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.state.selectedSuit = card.dataset.suit;
          this.renderPhotoPipeline();
        });
      });

      const smoothSlider = document.getElementById('smoothSlider');
      if (smoothSlider) {
        smoothSlider.addEventListener('input', (e) => {
          this.state.skinSmooth = parseInt(e.target.value, 10);
          document.getElementById('smoothVal').innerText = `${this.state.skinSmooth}%`;
          this.renderPhotoPipeline();
        });
      }

      const brightSlider = document.getElementById('brightSlider');
      if (brightSlider) {
        brightSlider.addEventListener('input', (e) => {
          this.state.brightness = parseInt(e.target.value, 10);
          document.getElementById('brightVal').innerText = `${this.state.brightness > 0 ? '+' : ''}${this.state.brightness}%`;
          this.renderPhotoPipeline();
        });
      }

      const suitScaleSlider = document.getElementById('suitScaleSlider');
      if (suitScaleSlider) {
        suitScaleSlider.addEventListener('input', (e) => {
          this.state.suitScale = parseFloat(e.target.value);
          this.renderPhotoPipeline();
        });
      }

      const suitPosYSlider = document.getElementById('suitPosYSlider');
      if (suitPosYSlider) {
        suitPosYSlider.addEventListener('input', (e) => {
          this.state.suitOffsetY = parseInt(e.target.value, 10);
          this.renderPhotoPipeline();
        });
      }

      document.getElementById('btnDownloadSingle').addEventListener('click', () => this.downloadSinglePhoto());
      document.getElementById('btnDownloadPrint').addEventListener('click', () => this.downloadPrintSheet());
      document.getElementById('btnSavePtb').addEventListener('click', () => this.exportPtbProject());
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new IdPhotoApp();
    app.init();
  });
})(window);
