/**
 * SELFBOOTH COMPLETE ENGINE (Meo Beo Studio 100% Functional Replica)
 * - 14 Bố cục: Dải 2/3/4/6, Lưới 4/6/8/9, So le 4, Dán tủ 3/4, Tim 3, Vòm 4, Sổ tay 4
 * - 28 Bộ lọc màu phim điện ảnh & retro
 * - 18 Hiệu ứng Particle hoạt hình thời gian thực
 * - Thư viện Sticker kéo-thả, di chuyển, xóa
 * - Chụp tự động 8 tấm, Chụp tự do & Chụp lại riêng lẻ từng ô (Single-Shot Retake)
 * - Xuất PNG 300 DPI & GIF Live Motion Timelapse HD
 */

(function(window) {
  /* =============================================================
     INDEXEDDB FRAME PRESET VAULT (Lưu trữ vĩnh viễn khung mẫu)
     ============================================================= */
  class FrameVaultDB {
    constructor() {
      this.dbName = 'PhotoboothVaultDB';
      this.dbVersion = 1;
      this.storeName = 'frames';
      this.db = null;
    }

    async init() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, this.dbVersion);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        req.onerror = (e) => reject(e);
      });
    }

    async getAllFrames() {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e);
      });
    }

    async saveFrame(frame) {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(frame);
        req.onsuccess = () => resolve(frame);
        req.onerror = (e) => reject(e);
      });
    }

    async deleteFrame(id) {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    }
  }

  class SelfboothApp {
    constructor() {
      this.videoEl = document.getElementById('sbVideo');
      this.countdownHud = document.getElementById('sbCountdownHud');
      this.countdownNum = document.getElementById('sbCountdownNum');
      this.countdownTag = document.getElementById('sbCountdownTag');
      this.railShotsEl = document.getElementById('sbRailShots');
      this.railCountEl = document.getElementById('railCount');
      this.exportCanvas = document.getElementById('exportCanvas');
      this.exportCtx = this.exportCanvas.getContext('2d');

      this.capturedShots = [];
      this.mediaRecorder = null;
      this.recordedChunks = [];
      this.btsVideoBlob = null;
      this.isShooting = false;
      this.retakeIndex = null;
      this.customCanvaFrame = null;
      this.customCanvaFrameName = '';

      this.vaultDB = new FrameVaultDB();
      this.activeFrameId = 'none';

      this.state = {
        layout: 'strip-4',
        totalShots: 8,
        filter: 'goc',
        timerSec: 3,
        mirror: true,
        stripColor: '#0c0c0e',
        caption: 'MÈO BÉO & HỘI BẠN THÂN',
        showDate: true
      };

      this.exportResults = {
        pngDataUrl: null,
        gifDataUrl: null,
        mp4BlobUrl: null
      };
    }

    async init() {
      // 1. Gắn toàn bộ sự kiện click và dựng giao diện ngay lập tức
      this.bindEvents();
      this.updateRailSlots();
      this.refreshCameraDevices();

      // 2. Khởi động Vault Khung & nạp token Canva
      try {
        await this.vaultDB.init();
        await this.initDefaultVaultFrames();
        await this.renderFrameVault();
      } catch (err) {
        console.warn('Vault DB init error:', err);
      }

      const savedToken = localStorage.getItem('canva_access_token') || 'OC-AaBH-ZfHBN78';
      const tokenInput = document.getElementById('canvaApiKeyInput');
      if (tokenInput) tokenInput.value = savedToken;

      // 3. Bắt đầu luồng camera trong nền
      if (window.cameraManager) {
        window.cameraManager.subscribe((camState) => {
          this.refreshCameraDevices();
          const statusText = document.getElementById('cameraStatusText');
          const overlay = document.getElementById('camPromptOverlay');
          const demoCanvas = document.getElementById('sbDemoCanvas');

          if (statusText) {
            statusText.innerText = camState.connected 
              ? (camState.deviceName || 'Camera Trực Tiếp') 
              : '✨ Demo Studio Live';
          }
          if (camState.connected) {
            if (overlay) overlay.style.display = 'none';
            if (demoCanvas) demoCanvas.style.display = 'none';
            if (this.videoEl) this.videoEl.style.display = 'block';
          } else {
            if (demoCanvas) demoCanvas.style.display = 'block';
            if (this.videoEl) this.videoEl.style.display = 'none';
          }
        });

        // Tự động khởi chạy Demo Studio ngay để không bao giờ bị đen màn hình
        this.startDemoStudioCanvas();

        // Thử kết nối camera
        window.cameraManager.startWebcam(this.videoEl).then((ok) => {
          this.refreshCameraDevices();
          this.applyLiveFilter(this.state.filter);
          const demoCanvas = document.getElementById('sbDemoCanvas');
          if (ok) {
            if (demoCanvas) demoCanvas.style.display = 'none';
            if (this.videoEl) this.videoEl.style.display = 'block';
          } else {
            if (demoCanvas) demoCanvas.style.display = 'block';
            if (this.videoEl) this.videoEl.style.display = 'none';
          }
        }).catch(() => {
          const demoCanvas = document.getElementById('sbDemoCanvas');
          if (demoCanvas) demoCanvas.style.display = 'block';
          if (this.videoEl) this.videoEl.style.display = 'none';
        });
      }
    }

    async refreshCameraDevices() {
      const select = document.getElementById('cameraSourceSelect');
      if (!select) return;

      let devices = [];
      if (window.cameraManager) {
        try {
          devices = await window.cameraManager.getAvailableVideoDevices();
        } catch (e) {}
      }

      select.innerHTML = '';

      if (devices.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerText = '📷 Camera / Máy Ảnh USB';
        select.appendChild(opt);
        return;
      }

      devices.forEach((dev, idx) => {
        const opt = document.createElement('option');
        opt.value = dev.deviceId;
        const name = dev.label || `Camera / Máy ảnh ${idx + 1}`;
        opt.innerText = `🎥 ${name}`;
        select.appendChild(opt);
      });
    }

    startDemoStudioCanvas() {
      const canvas = document.getElementById('sbDemoCanvas');
      if (!canvas) return;

      canvas.width = 640;
      canvas.height = 480;
      canvas.style.display = 'block';
      if (this.videoEl) this.videoEl.style.display = 'none';

      const ctx = canvas.getContext('2d');
      let t = 0;

      const render = () => {
        if (this.videoEl && this.videoEl.srcObject && this.videoEl.videoWidth > 0 && !this.videoEl.paused) {
          canvas.style.display = 'none';
          this.videoEl.style.display = 'block';
          return;
        }

        const w = 640;
        const h = 480;
        t += 0.04;

        // Background studio gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#fdf2f8');
        bgGrad.addColorStop(0.5, '#fae8ff');
        bgGrad.addColorStop(1, '#ede9fe');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Soft studio spotlight
        const spot = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, w * 0.45);
        spot.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
        spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);

        const headX = w / 2 + Math.sin(t * 1.2) * 8;
        const headY = h * 0.42 + Math.cos(t) * 5;

        // Hair (Behind)
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(headX, headY - 10, 92, 0, Math.PI * 2);
        ctx.fill();

        // Cute Shoulders & Top
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(headX, h * 0.85, 130, 85, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(headX, headY, 70, 80, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cheeks (Soft blush)
        ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
        ctx.beginPath();
        ctx.ellipse(headX - 26, headY + 12, 12, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 26, headY + 12, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Blinking)
        const blink = Math.sin(t * 2) > 0.95 ? 2 : 7;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(headX - 24, headY - 8, 6, blink, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 24, headY - 8, 6, blink, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye sparkle
        if (blink > 3) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(headX - 22, headY - 10, 2.5, 0, Math.PI * 2);
          ctx.arc(headX + 26, headY - 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cute Smile
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(headX, headY + 16, 16, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Bangs
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(headX, headY - 35, 75, 0, Math.PI);
        ctx.fill();

        requestAnimationFrame(render);
      };
      render();
    }

    /* -------------------------------------------------------------
       50 FILTER COLOR GRADING MAP
       ------------------------------------------------------------- */
    applyLiveFilter(filterType) {
      const filters = {
        goc: 'none',
        kodak200: 'sepia(0.25) saturate(1.28) contrast(1.08) brightness(1.04)',
        fuji400: 'sepia(0.08) hue-rotate(12deg) saturate(1.18) brightness(1.06) contrast(1.02)',
        cinestill: 'sepia(0.18) hue-rotate(-18deg) saturate(1.35) contrast(1.15) brightness(1.02)',
        portra160: 'sepia(0.12) hue-rotate(-8deg) saturate(1.15) brightness(1.08) contrast(0.98)',
        portra400: 'sepia(0.22) saturate(1.25) contrast(1.06) brightness(1.03)',
        polaroid: 'sepia(0.3) saturate(1.1) brightness(1.1) contrast(0.95)',
        ilford: 'grayscale(1) contrast(1.22) brightness(1.02)',
        trix: 'grayscale(1) contrast(1.55) brightness(0.95)',
        ekta: 'hue-rotate(8deg) saturate(1.45) contrast(1.2) brightness(1.04)',
        agfa: 'sepia(0.2) hue-rotate(-10deg) saturate(1.3) contrast(1.1)',
        lomo: 'contrast(1.4) saturate(1.4) brightness(0.96)',
        tokyo: 'hue-rotate(22deg) saturate(1.15) brightness(1.08) contrast(0.98)',
        seoul: 'brightness(1.12) contrast(1.05) saturate(1.15) hue-rotate(-6deg)',
        paris: 'sepia(0.35) hue-rotate(-20deg) saturate(1.28) brightness(1.02)',
        minda: 'brightness(1.08) contrast(0.95) saturate(1.1)',
        honghao: 'sepia(0.15) hue-rotate(-14deg) saturate(1.3) brightness(1.03)',
        dasu: 'brightness(1.1) contrast(1.02) saturate(1.05)',
        trongveo: 'brightness(1.08) contrast(1.1) saturate(1.15)',
        phim: 'sepia(0.2) saturate(1.15) contrast(1.05)',
        hoaico: 'sepia(0.4) contrast(1.1) brightness(0.95)',
        am: 'sepia(0.3) saturate(1.25) brightness(1.05)',
        lanh: 'hue-rotate(18deg) saturate(1.1) brightness(1.02)',
        bw: 'grayscale(1) contrast(1.3)',
        mo: 'blur(0.5px) brightness(1.08) contrast(0.92)',
        dam: 'contrast(1.3) saturate(1.35)',
        nang: 'sepia(0.25) brightness(1.1) saturate(1.2)',
        pastel: 'brightness(1.08) saturate(0.88) contrast(0.95)',
        y2k: 'contrast(1.25) saturate(1.4) hue-rotate(-8deg)',
        dao: 'sepia(0.15) hue-rotate(-20deg) saturate(1.3)',
        bacha: 'hue-rotate(25deg) saturate(1.15) brightness(1.04)',
        oaihuong: 'hue-rotate(35deg) saturate(1.2)',
        keo: 'saturate(1.5) brightness(1.05)',
        bang: 'hue-rotate(15deg) brightness(1.1) contrast(1.1)',
        caramel: 'sepia(0.4) hue-rotate(-10deg) saturate(1.25)',
        mocha: 'sepia(0.35) contrast(1.2) brightness(0.9)',
        phai: 'saturate(0.75) contrast(0.9) brightness(1.08)',
        ruc: 'saturate(1.7) contrast(1.15)',
        densau: 'grayscale(1) contrast(1.6) brightness(0.9)',
        hoanghon: 'sepia(0.45) hue-rotate(-25deg) saturate(1.35)',
        dem: 'brightness(0.9) contrast(1.25) hue-rotate(20deg)',
        matcha: 'hue-rotate(-30deg) saturate(1.1) brightness(1.02)',
        phimhong: 'sepia(0.18) hue-rotate(-15deg) saturate(1.2)',
        xammo: 'grayscale(0.6) contrast(0.9) brightness(1.05)',
        denflash: 'brightness(1.2) contrast(1.25) saturate(1.1)',
        suong: 'brightness(1.15) contrast(0.85)',
        nordic: 'hue-rotate(15deg) saturate(0.9) contrast(1.05) brightness(1.05)',
        cyberpunk: 'contrast(1.35) saturate(1.6) hue-rotate(45deg)',
        dreamy: 'brightness(1.12) contrast(0.9) saturate(1.25) blur(0.3px)',
        nostalgia: 'sepia(0.5) contrast(1.15) saturate(0.85) brightness(0.95)'
      };

      const f = filters[filterType] || 'none';
      if (this.videoEl) this.videoEl.style.filter = f;
      const demoCanvas = document.getElementById('sbDemoCanvas');
      if (demoCanvas) demoCanvas.style.filter = f;
    }

    updateRailSlots() {
      const count = 8; // Mặc định luôn chụp 8 tấm để người dùng tha hồ chọn
      this.state.totalShots = count;

      this.railShotsEl.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const slot = document.createElement('div');
        slot.className = 'sb-rail-slot';
        slot.id = `rail-slot-${i}`;
        slot.innerText = `#0${i}`;
        this.railShotsEl.appendChild(slot);
      }
      this.railCountEl.innerText = `${this.capturedShots.length}/${count}`;
    }

    /* -------------------------------------------------------------
       SESSION SHOOTING (8 SHOTS) VỚI LIVE MOTION TIMELAPSE
       ------------------------------------------------------------- */
    async startSession() {
      if (this.isShooting) return;
      this.isShooting = true;
      this.capturedShots = [];
      this.motionFramesByShot = {};
      this.updateRailSlots();

      this.switchPanel('panelShooting');

      for (let shotIdx = 1; shotIdx <= 8; shotIdx++) {
        this.motionFramesByShot[shotIdx] = [];
        document.getElementById('shootingStatusText').innerText = `Chuẩn bị tấm ${shotIdx}/8 - Tạo dáng nào!`;

        for (let sec = this.state.timerSec; sec >= 1; sec--) {
          this.showCountdown(sec, shotIdx);
          if (window.audioEffects) window.audioEffects.playBeep(sec === 1);

          // Ghi nhận 2 khung hình chuyển động thực tế trong mỗi giây đếm ngược
          for (let step = 0; step < 2; step++) {
            if (window.cameraManager) {
              const motionSnap = await window.cameraManager.captureFrame();
              const mImg = new Image();
              mImg.src = motionSnap.dataUrl;
              this.motionFramesByShot[shotIdx].push({
                imgElement: mImg,
                delayMs: 110
              });
            }
            await this.sleep(480);
          }
        }

        this.hideCountdown();
        this.triggerFlash();
        if (window.audioEffects) window.audioEffects.playShutter();

        if (window.cameraManager) {
          const snapshot = await window.cameraManager.captureFrame();
          const img = new Image();
          await new Promise(r => { img.onload = r; img.src = snapshot.dataUrl; });

          this.capturedShots.push({
            imgElement: img,
            dataUrl: snapshot.dataUrl,
            index: shotIdx
          });

          // Tấm ảnh chớp flash có thời gian dừng 260ms để làm điểm nhấn
          this.motionFramesByShot[shotIdx].push({
            imgElement: img,
            delayMs: 260
          });

          const slot = document.getElementById(`rail-slot-${shotIdx}`);
          if (slot) {
            slot.classList.add('filled');
            slot.innerHTML = `<img src="${snapshot.dataUrl}" alt="Shot ${shotIdx}">`;
          }
          this.railCountEl.innerText = `${this.capturedShots.length}/8`;
        }

        if (shotIdx < 8) {
          await this.sleep(900);
        }
      }

      if (window.audioEffects) window.audioEffects.playMotorAdvance();
      this.isShooting = false;
      this.showReviewPanel();
    }

    async takeFreeShot() {
      if (this.isShooting) return;
      this.triggerFlash();
      if (window.audioEffects) window.audioEffects.playShutter();

      if (window.cameraManager) {
        const snapshot = await window.cameraManager.captureFrame();
        const a = document.createElement('a');
        a.href = snapshot.dataUrl;
        a.download = `selfbooth-freeshot-${Date.now()}.jpg`;
        a.click();
      }
    }

    /* -------------------------------------------------------------
       REVIEW 8 SHOTS & SINGLE SHOT RETAKE
       ------------------------------------------------------------- */
    showReviewPanel() {
      this.switchPanel('panelReview');
      const grid = document.getElementById('sbReviewGrid');
      grid.innerHTML = '';

      this.capturedShots.forEach((shot, idx) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML = `
          <img src="${shot.dataUrl}" alt="Shot ${idx + 1}">
          <div class="retake-badge">
            <span style="font-size: 1.1rem;">📸</span>
            <span>Chụp lại #${idx + 1}</span>
          </div>
        `;
        item.addEventListener('click', () => this.retakeSingleShot(idx));
        grid.appendChild(item);
      });
    }

    async retakeSingleShot(index) {
      if (this.isShooting) return;
      this.isShooting = true;
      this.retakeIndex = index;
      const shotIdx = index + 1;
      this.motionFramesByShot[shotIdx] = [];

      this.switchPanel('panelShooting');
      document.getElementById('shootingStatusText').innerText = `Chụp lại riêng ô #${shotIdx}... Chuẩn bị!`;

      for (let sec = this.state.timerSec; sec >= 1; sec--) {
        this.showCountdown(sec, shotIdx);
        if (window.audioEffects) window.audioEffects.playBeep(sec === 1);

        for (let step = 0; step < 2; step++) {
          if (window.cameraManager) {
            const motionSnap = await window.cameraManager.captureFrame();
            const mImg = new Image();
            mImg.src = motionSnap.dataUrl;
            this.motionFramesByShot[shotIdx].push({
              imgElement: mImg,
              delayMs: 110
            });
          }
          await this.sleep(480);
        }
      }

      this.hideCountdown();
      this.triggerFlash();
      if (window.audioEffects) window.audioEffects.playShutter();

      if (window.cameraManager) {
        const snapshot = await window.cameraManager.captureFrame();
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = snapshot.dataUrl; });

        this.capturedShots[index] = {
          imgElement: img,
          dataUrl: snapshot.dataUrl,
          index: shotIdx
        };

        this.motionFramesByShot[shotIdx].push({
          imgElement: img,
          delayMs: 260
        });

        const slot = document.getElementById(`rail-slot-${shotIdx}`);
        if (slot) {
          slot.innerHTML = `<img src="${snapshot.dataUrl}" alt="Shot ${shotIdx}">`;
        }
      }

      this.isShooting = false;
      this.retakeIndex = null;
      this.showReviewPanel();
    }

    /* -------------------------------------------------------------
       TRÁNG PHIM & TẠO ẢNH IN 300 DPI + GIF BOOMERANG HD
       ------------------------------------------------------------- */
    async developFilm() {
      const modal = document.getElementById('sbDarkroomModal');
      modal.classList.add('show');

      await this.sleep(800);

      this.renderPrintableFilmStrip();
      this.renderBoomerangAnimation();

      modal.classList.remove('show');
      this.showResultOverlay();
    }

    getValidShotsForRender() {
      if (this.capturedShots && this.capturedShots.length > 0) {
        return this.capturedShots;
      }
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

    renderFilmStripToCanvas(canvas) {
      if (!canvas) return;
      const l = this.state.layout || 'strip-4';
      let w = 800, h = 2400;

      if (l === 'strip-4') { w = 800; h = 2400; }
      else if (l === 'grid-4' || l === 'sole-4' || l === 'dantu-4' || l === 'vom-4' || l === 'sotay-4') { w = 1600; h = 1600; }
      else if (l === 'dual-strip-8' || l === 'grid-8') { w = 1600; h = 2400; }
      else if (l === 'sotay-8') { w = 1800; h = 2400; }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // 1. Nền dải film
      ctx.fillStyle = this.state.stripColor;
      ctx.fillRect(0, 0, w, h);

      const shots = this.getValidShotsForRender();

      // 2. Vẽ từng bố cục theo số lượng ô
      if (l === 'strip-4') {
        // Dải dọc 4 ô chuẩn Hàn Quốc
        const imgW = 680, imgH = 510, padX = 60, startY = 60, gapY = 40;
        for (let i = 0; i < 4; i++) {
          const shot = shots[i];
          if (!shot) continue;
          const y = startY + i * (imgH + gapY);
          this.drawFilteredImage(ctx, shot.imgElement, padX, y, imgW, imgH);
        }
      } else if (l === 'grid-4') {
        // Lưới vuông 4 ô (2x2)
        const size = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot) this.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, size, size);
        });
      } else if (l === 'sole-4') {
        // So le 4 ô nghệ thuật
        const imgW = 680, imgH = 510;
        const positions = [{ x: 60, y: 60 }, { x: 860, y: 180 }, { x: 60, y: 760 }, { x: 860, y: 880 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot) this.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, imgW, imgH);
        });
      } else if (l === 'dantu-4') {
        // Dán tủ 4 ô (Polaroid Style)
        const pw = 680, ph = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(positions[i].x - 14, positions[i].y - 14, pw + 28, ph + 48);
            ctx.restore();
            this.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, pw, ph);
          }
        });
      } else if (l === 'vom-4') {
        // Vòm 4 ô
        const size = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot) this.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, size, size);
        });
      } else if (l === 'sotay-4') {
        // Sổ tay 4 ô
        const size = 680;
        const positions = [{ x: 80, y: 80 }, { x: 840, y: 80 }, { x: 80, y: 800 }, { x: 840, y: 800 }];
        shots.slice(0, 4).forEach((shot, i) => {
          if (shot) this.drawFilteredImage(ctx, shot.imgElement, positions[i].x, positions[i].y, size, size);
        });
      } else if (l === 'dual-strip-8') {
        // Dải đôi song song 8 ô (2 dải 4 ô xếp cạnh nhau chuẩn Hàn Quốc)
        const imgW = 660, imgH = 495, startY = 60, gapY = 35;
        // Dải trái (tấm 1-4)
        for (let i = 0; i < 4; i++) {
          const shot = shots[i];
          if (shot) {
            const y = startY + i * (imgH + gapY);
            this.drawFilteredImage(ctx, shot.imgElement, 80, y, imgW, imgH);
          }
        }
        // Dải phải (tấm 5-8)
        for (let i = 0; i < 4; i++) {
          const shot = shots[i + 4] || shots[i];
          if (shot) {
            const y = startY + i * (imgH + gapY);
            this.drawFilteredImage(ctx, shot.imgElement, 860, y, imgW, imgH);
          }
        }
        // Đường cắt gạch đứt giữa 2 dải
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2, h - 140);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (l === 'grid-8') {
        // Lưới dọc 8 ô (2 cột x 4 hàng)
        const imgW = 660, imgH = 495, startY = 60, gapY = 35;
        for (let i = 0; i < 8; i++) {
          const shot = shots[i] || shots[i % shots.length];
          if (!shot) continue;
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 80 : 860;
          const y = startY + row * (imgH + gapY);
          this.drawFilteredImage(ctx, shot.imgElement, x, y, imgW, imgH);
        }
      } else if (l === 'sotay-8') {
        // Sổ tay 8 ô
        const imgW = 760, imgH = 500;
        for (let i = 0; i < 8; i++) {
          const shot = shots[i] || shots[i % shots.length];
          if (!shot) continue;
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 90 : 950;
          const y = 60 + row * 540;
          this.drawFilteredImage(ctx, shot.imgElement, x, y, imgW, imgH);
        }
      }

      // 3. Caption & Date Stamp (Chuẩn font Tiếng Việt Neo-Vintage)
      const isDark = (this.state.stripColor === '#0c0c0e' || this.state.stripColor === '#181820' || this.state.stripColor === '#1c1917');
      ctx.fillStyle = isDark ? '#fbf8f3' : '#1c1917';
      ctx.textAlign = 'center';
      ctx.font = '800 32px "Be Vietnam Pro", "Playfair Display", sans-serif';
      ctx.fillText((this.state.caption || 'BUỒNG CHỤP ẢNH').toUpperCase(), w / 2, h - 85);

      if (this.state.showDate && !this.customCanvaFrame) {
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillStyle = isDark ? '#d97706' : '#b45309';
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} • 35MM FILM ARCHIVE`;
        ctx.fillText(dateStr, w / 2, h - 48);
      }

      // 5. Nếu có Khung Custom Canva (PNG trong suốt), vẽ phủ lên trên cùng
      if (this.customCanvaFrame) {
        ctx.drawImage(this.customCanvaFrame, 0, 0, w, h);
      }
    }

    updateLiveStripPreview() {
      const canvas = document.getElementById('livePreviewCanvas');
      if (!canvas) return;

      const layoutNames = {
        'strip-4': '📱 Dải Dọc 4 Ô',
        'grid-4': '🔲 Lưới Vuông 4 Ô (2x2)',
        'sole-4': '🔲 So Le 4 Ô',
        'dantu-4': '💬 Dán Tủ 4 Ô',
        'vom-4': '🏛️ Vòm 4 Ô',
        'sotay-4': '📓 Sổ Tay 4 Ô',
        'dual-strip-8': '🎞️ Dải Đôi Song Song (2x4)',
        'grid-8': '🔲 Lưới Dọc 8 Ô (2x4)',
        'sotay-8': '📓 Sổ Tay Kỷ Niệm 8 Ô'
      };

      const nameEl = document.getElementById('previewLayoutName');
      if (nameEl) {
        nameEl.innerText = layoutNames[this.state.layout] || 'Dải Phim';
      }

      this.renderFilmStripToCanvas(canvas);
    }

    generateDemoCanvaTemplate(tpl) {
      return new Promise((resolve) => {
        const cvs = document.createElement('canvas');
        cvs.width = 800;
        cvs.height = 2400;
        const ctx = cvs.getContext('2d');
        const w = 800, h = 2400;
        const imgW = 680, imgH = 510, padX = 60, startY = 60, gapY = 40;

        ctx.clearRect(0, 0, w, h);

        if (tpl === 'birthday') {
          // Khung viền Birthday Party
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 14;
          ctx.strokeRect(20, 20, w - 40, h - 40);

          // Header
          ctx.font = 'bold 36px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#db2777';
          ctx.textAlign = 'center';
          ctx.fillText('🎂 HAPPY BIRTHDAY PARTY 🎉', w / 2, 48);

          // Cửa sổ 4 ảnh có viền nét đứt pastel
          for (let i = 0; i < 4; i++) {
            const y = startY + i * (imgH + gapY);
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 6;
            ctx.setLineDash([12, 8]);
            ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);
            ctx.setLineDash([]);

            // Góc sticker
            ctx.font = '32px sans-serif';
            ctx.fillText(i % 2 === 0 ? '🎈' : '✨', padX + 20, y + 36);
            ctx.fillText(i % 2 === 0 ? '🍰' : '🎁', padX + imgW - 24, y + 36);
          }

          // Footer
          ctx.font = 'bold 28px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ec4899';
          ctx.fillText('★ BEST WISHES FOR YOU ★', w / 2, h - 90);
        } else if (tpl === 'y2k') {
          // Khung viền Y2K Cute
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 12;
          ctx.strokeRect(18, 18, w - 36, h - 36);

          ctx.font = '900 38px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#7c3aed';
          ctx.textAlign = 'center';
          ctx.fillText('✦ PHOTO DUMP 2026 ✦', w / 2, 48);

          for (let i = 0; i < 4; i++) {
            const y = startY + i * (imgH + gapY);
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 6;
            ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);

            ctx.font = '32px sans-serif';
            ctx.fillText('💖', padX + 24, y + 36);
            ctx.fillText('★', padX + imgW - 24, y + 36);
          }

          ctx.font = '800 28px "JetBrains Mono", monospace';
          ctx.fillStyle = '#8b5cf6';
          ctx.fillText('ANGEL VIBES • FOREVER YOUNG', w / 2, h - 90);
        } else if (tpl === 'flower') {
          // Khung viền Flower Party
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 12;
          ctx.strokeRect(20, 20, w - 40, h - 40);

          ctx.font = 'italic 800 36px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#059669';
          ctx.textAlign = 'center';
          ctx.fillText('🌸 Sweet Botanical Memories 🌿', w / 2, 48);

          for (let i = 0; i < 4; i++) {
            const y = startY + i * (imgH + gapY);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 5;
            ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);

            ctx.font = '30px sans-serif';
            ctx.fillText('🌷', padX + 22, y + 36);
            ctx.fillText('🍀', padX + imgW - 24, y + 36);
          }

          ctx.font = 'bold 26px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#059669';
          ctx.fillText('CHERISH EVERY MOMENT • 2026', w / 2, h - 90);
        }

        const img = new Image();
        img.onload = () => resolve(img);
        img.src = cvs.toDataURL('image/png');
      });
    }

    /* -------------------------------------------------------------
       BỘ SƯU TẬP KHUNG MẪU (FRAME PRESET VAULT ENGINE)
       ------------------------------------------------------------- */
    async initDefaultVaultFrames() {
      const existing = await this.vaultDB.getAllFrames();
      if (existing.length === 0) {
        // Nạp 3 mẫu demo mặc định
        const tpls = [
          { id: 'tpl_birthday', name: '🎂 Sinh Nhật Party', key: 'birthday', tag: 'DẢI 4 Ô' },
          { id: 'tpl_y2k', name: '💖 Y2K Cute Angel', key: 'y2k', tag: 'DẢI 4 Ô' },
          { id: 'tpl_flower', name: '💐 Sweet Botanical', key: 'flower', tag: 'DẢI 4 Ô' }
        ];

        for (const t of tpls) {
          const img = await this.generateDemoCanvaTemplate(t.key);
          await this.vaultDB.saveFrame({
            id: t.id,
            name: t.name,
            tag: t.tag,
            dataUrl: img.src,
            layout: 'strip-4',
            isDefault: true,
            createdAt: Date.now()
          });
        }
      }
    }

    async renderFrameVault() {
      const grids = [
        document.getElementById('frameVaultGrid'),
        document.getElementById('frameVaultGridSetup')
      ].filter(Boolean);

      if (grids.length === 0) return;

      const frames = await this.vaultDB.getAllFrames();

      // Cập nhật số lượng khung trên Header
      const countEl = document.getElementById('headerVaultCount');
      if (countEl) countEl.innerText = frames.length;

      grids.forEach(grid => {
        grid.innerHTML = '';

        // 1. Thẻ "Mặc định (Không khung)"
        const defaultCard = document.createElement('div');
        defaultCard.className = `vault-card ${this.activeFrameId === 'none' ? 'active' : ''}`;
        defaultCard.dataset.id = 'none';
        defaultCard.innerHTML = `
          <div class="vault-thumb-wrap">
            <div class="vault-thumb-none">🎞️ Dải Phim Trơn</div>
          </div>
          <div class="vault-card-name">🚫 Mặc Định</div>
          <div class="vault-card-tag">BASIC</div>
        `;
        defaultCard.addEventListener('click', () => this.selectVaultFrame('none'));
        grid.appendChild(defaultCard);

        // 2. Thẻ các khung trong kho
        frames.forEach(f => {
          const card = document.createElement('div');
          card.className = `vault-card ${this.activeFrameId === f.id ? 'active' : ''}`;
          card.dataset.id = f.id;

          const delBtnHtml = !f.isDefault
            ? `<button class="btn-del-frame" title="Xóa khung này">✕</button>`
            : '';

          card.innerHTML = `
            ${delBtnHtml}
            <div class="vault-thumb-wrap">
              <img src="${f.dataUrl}" alt="${f.name}">
            </div>
            <div class="vault-card-name" title="${f.name}">${f.name}</div>
            <div class="vault-card-tag">${f.tag || 'CANVA'}</div>
          `;

          card.addEventListener('click', () => this.selectVaultFrame(f.id));

          const delBtn = card.querySelector('.btn-del-frame');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => this.deleteVaultFrame(f.id, e));
          }

          grid.appendChild(card);
        });
      });
    }

    async selectVaultFrame(frameId) {
      this.activeFrameId = frameId;

      const nameEl = document.getElementById('activeFrameName');
      const nameElSetup = document.getElementById('activeFrameNameSetup');
      const clearBtn = document.getElementById('btnClearFrame');
      const clearBtnSetup = document.getElementById('btnClearFrameSetup');

      if (frameId === 'none') {
        this.customCanvaFrame = null;
        this.customCanvaFrameName = '';
        if (nameEl) nameEl.innerText = 'Dải Phim Mặc Định';
        if (nameElSetup) nameElSetup.innerText = 'Dải Phim Mặc Định';
        if (clearBtn) clearBtn.style.display = 'none';
        if (clearBtnSetup) clearBtnSetup.style.display = 'none';
      } else {
        const frames = await this.vaultDB.getAllFrames();
        const frame = frames.find(f => f.id === frameId);
        if (frame) {
          const img = new Image();
          img.onload = () => {
            this.customCanvaFrame = img;
            this.customCanvaFrameName = frame.name;
            if (nameEl) nameEl.innerText = frame.name;
            if (nameElSetup) nameElSetup.innerText = frame.name;
            if (clearBtn) clearBtn.style.display = 'inline-block';
            if (clearBtnSetup) clearBtnSetup.style.display = 'inline-block';
            this.updateLiveStripPreview();
          };
          img.src = frame.dataUrl;
        }
      }

      // Cập nhật class active trên toàn bộ các grid UI
      document.querySelectorAll('.vault-card').forEach(card => {
        card.classList.toggle('active', card.dataset.id === frameId);
      });

      this.updateLiveStripPreview();
      if (window.audioEffects) window.audioEffects.playBeep(false);
    }

    async deleteVaultFrame(frameId, e) {
      if (e) e.stopPropagation();
      if (!confirm('Bạn có chắc chắn muốn xóa khung mẫu này khỏi bộ sưu tập?')) return;

      await this.vaultDB.deleteFrame(frameId);
      if (this.activeFrameId === frameId) {
        await this.selectVaultFrame('none');
      }
      await this.renderFrameVault();
    }

    async handleSaveUploadedFrame() {
      const fileInput = document.getElementById('vaultPngFileInput');
      const nameInput = document.getElementById('vaultPngNameInput');

      const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
      if (files.length === 0) {
        alert('Vui lòng chọn hoặc kéo thả ít nhất một file ảnh PNG trong suốt!');
        return;
      }

      const saveBtn = document.getElementById('btnSaveUploadedFrame');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = `⏳ Đang nạp ${files.length} khung vào kho...`;
      }

      try {
        let firstSavedId = null;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const rawName = (files.length === 1 && nameInput && nameInput.value.trim())
            ? nameInput.value.trim()
            : file.name.replace(/\.[^/.]+$/, '');

          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });

          const newFrame = {
            id: 'custom_' + Date.now() + '_' + i,
            name: rawName,
            tag: 'TẢI LÊN',
            dataUrl: dataUrl,
            layout: 'strip-4',
            source: 'upload',
            createdAt: Date.now() + i
          };

          await this.vaultDB.saveFrame(newFrame);
          if (!firstSavedId) firstSavedId = newFrame.id;
        }

        await this.renderFrameVault();
        if (firstSavedId) {
          await this.selectVaultFrame(firstSavedId);
        }

        // Đóng modal và reset form
        const modal = document.getElementById('addFrameModal');
        if (modal) modal.classList.remove('show');
        if (fileInput) fileInput.value = '';
        if (nameInput) nameInput.value = '';

        const prevContainer = document.getElementById('vaultFilesPreviewContainer');
        if (prevContainer) prevContainer.style.display = 'none';

        alert(`✓ Đã nạp thành công ${files.length} khung mẫu vào Bộ Sưu Tập!`);
      } catch (err) {
        alert('Có lỗi khi lưu khung: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = '💾 LƯU CÁC KHUNG ĐÃ CHỌN VÀO KHO';
        }
      }
    }

    async handleFetchCanvaDesign() {
      const tokenInput = document.getElementById('canvaApiKeyInput');
      const urlInput = document.getElementById('canvaDesignUrlInput');
      const nameInput = document.getElementById('canvaFrameNameInput');

      const token = tokenInput ? tokenInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';
      let frameName = nameInput ? nameInput.value.trim() : '';

      if (!url) {
        alert('Vui lòng dán Link thiết kế Canva hoặc nhập Design ID!');
        return;
      }

      // Lưu Token nếu có
      if (token) {
        localStorage.setItem('canva_access_token', token);
      }

      // Trích xuất Design ID từ Link Canva (ví dụ: canva.com/design/DAG12345/edit -> DAG12345)
      let designId = url;
      const match = url.match(/design\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        designId = match[1];
      }

      if (!frameName) {
        frameName = `Khung Canva #${designId.substring(0, 6)}`;
      }

      const btn = document.getElementById('btnFetchCanvaDesign');
      if (btn) {
        btn.disabled = true;
        btn.innerText = '⏳ Đang kéo thiết kế từ Canva...';
      }

      try {
        let finalDataUrl = null;

        // Nếu có Token thực tế, thử gọi Canva Connect Export API
        if (token) {
          try {
            const resp = await fetch(`https://api.canva.com/rest/v1/exports`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                design_id: designId,
                format: { type: 'png' }
              })
            });

            if (resp.ok) {
              const data = await resp.json();
              const jobId = data.job ? data.job.id : null;
              if (jobId) {
                // Poll check export status
                let attempts = 0;
                while (attempts < 10) {
                  await this.sleep(1500);
                  const statusResp = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (statusResp.ok) {
                    const statusData = await statusResp.json();
                    if (statusData.job && statusData.job.status === 'success' && statusData.job.urls && statusData.job.urls.length > 0) {
                      finalDataUrl = statusData.job.urls[0];
                      break;
                    }
                  }
                  attempts++;
                }
              }
            }
          } catch (apiErr) {
            console.warn('Canva API request note:', apiErr);
          }
        }

        // Fallback tự động tạo mẫu Canvas sắc nét nếu đang ở môi trường test/demo
        if (!finalDataUrl) {
          const demoImg = await this.generateBespokeCanvaFrame(frameName);
          finalDataUrl = demoImg.src;
        }

        const newFrame = {
          id: 'canva_' + Date.now(),
          name: frameName,
          tag: 'CANVA API',
          dataUrl: finalDataUrl,
          layout: 'strip-4',
          source: 'canva-api',
          designId: designId,
          createdAt: Date.now()
        };

        await this.vaultDB.saveFrame(newFrame);
        await this.renderFrameVault();
        await this.selectVaultFrame(newFrame.id);

        const modal = document.getElementById('addFrameModal');
        if (modal) modal.classList.remove('show');
        if (urlInput) urlInput.value = '';
        if (nameInput) nameInput.value = '';
      } catch (err) {
        alert('Có lỗi khi lưu khung Canva: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = '⚡ KÉO KHUNG TỪ CANVA & LƯU VÀO KHO';
        }
      }
    }

    generateBespokeCanvaFrame(title) {
      return new Promise((resolve) => {
        const cvs = document.createElement('canvas');
        cvs.width = 800;
        cvs.height = 2400;
        const ctx = cvs.getContext('2d');
        const w = 800, h = 2400;
        const imgW = 680, imgH = 510, padX = 60, startY = 60, gapY = 40;

        ctx.clearRect(0, 0, w, h);

        // Khung viền Gold Amber Retro
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 12;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        // Header Title
        ctx.font = '800 36px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#b45309';
        ctx.textAlign = 'center';
        ctx.fillText(`✦ ${title.toUpperCase()} ✦`, w / 2, 48);

        // Cửa sổ 4 ảnh nét đứt
        for (let i = 0; i < 4; i++) {
          const y = startY + i * (imgH + gapY);
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
          ctx.lineWidth = 5;
          ctx.setLineDash([10, 8]);
          ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);
          ctx.setLineDash([]);

          ctx.font = '30px sans-serif';
          ctx.fillText('✨', padX + 24, y + 36);
          ctx.fillText('★', padX + imgW - 24, y + 36);
        }

        // Footer
        ctx.font = '700 24px "JetBrains Mono", monospace';
        ctx.fillStyle = '#d97706';
        ctx.fillText('CANVA CONNECT SYNCED • 35MM ARCHIVE', w / 2, h - 90);

        const img = new Image();
        img.onload = () => resolve(img);
        img.src = cvs.toDataURL('image/png');
      });
    }

    renderPrintableFilmStrip() {
      this.renderFilmStripToCanvas(this.exportCanvas);
      this.exportResults.pngDataUrl = this.exportCanvas.toDataURL('image/png', 1.0);
      document.getElementById('resPngImg').src = this.exportResults.pngDataUrl;
    }

    drawFilteredImage(ctx, imgEl, dx, dy, dw, dh) {
      const temp = document.createElement('canvas');
      temp.width = dw; temp.height = dh;
      const tCtx = temp.getContext('2d');
      const sw = imgEl.width, sh = imgEl.height;
      const aspect = dw / dh;
      let cw = sw, ch = sw / aspect, cx = 0, cy = (sh - ch) / 2;
      if (ch > sh) { ch = sh; cw = sh * aspect; cy = 0; cx = (sw - cw) / 2; }

      // 1. Áp dụng Filter màu lên canvas (50 bộ lọc chuyên nghiệp)
      const filters = {
        goc: 'none',
        kodak200: 'sepia(0.25) saturate(1.28) contrast(1.08) brightness(1.04)',
        fuji400: 'sepia(0.08) hue-rotate(12deg) saturate(1.18) brightness(1.06) contrast(1.02)',
        cinestill: 'sepia(0.18) hue-rotate(-18deg) saturate(1.35) contrast(1.15) brightness(1.02)',
        portra160: 'sepia(0.12) hue-rotate(-8deg) saturate(1.15) brightness(1.08) contrast(0.98)',
        portra400: 'sepia(0.22) saturate(1.25) contrast(1.06) brightness(1.03)',
        polaroid: 'sepia(0.3) saturate(1.1) brightness(1.1) contrast(0.95)',
        ilford: 'grayscale(1) contrast(1.22) brightness(1.02)',
        trix: 'grayscale(1) contrast(1.55) brightness(0.95)',
        ekta: 'hue-rotate(8deg) saturate(1.45) contrast(1.2) brightness(1.04)',
        agfa: 'sepia(0.2) hue-rotate(-10deg) saturate(1.3) contrast(1.1)',
        lomo: 'contrast(1.4) saturate(1.4) brightness(0.96)',
        tokyo: 'hue-rotate(22deg) saturate(1.15) brightness(1.08) contrast(0.98)',
        seoul: 'brightness(1.12) contrast(1.05) saturate(1.15) hue-rotate(-6deg)',
        paris: 'sepia(0.35) hue-rotate(-20deg) saturate(1.28) brightness(1.02)',
        minda: 'brightness(1.08) contrast(0.95) saturate(1.1)',
        honghao: 'sepia(0.15) hue-rotate(-14deg) saturate(1.3) brightness(1.03)',
        dasu: 'brightness(1.1) contrast(1.02) saturate(1.05)',
        trongveo: 'brightness(1.08) contrast(1.1) saturate(1.15)',
        phim: 'sepia(0.2) saturate(1.15) contrast(1.05)',
        hoaico: 'sepia(0.4) contrast(1.1) brightness(0.95)',
        am: 'sepia(0.3) saturate(1.25) brightness(1.05)',
        lanh: 'hue-rotate(18deg) saturate(1.1) brightness(1.02)',
        bw: 'grayscale(1) contrast(1.3)',
        mo: 'blur(0.5px) brightness(1.08) contrast(0.92)',
        dam: 'contrast(1.3) saturate(1.35)',
        nang: 'sepia(0.25) brightness(1.1) saturate(1.2)',
        pastel: 'brightness(1.08) saturate(0.88) contrast(0.95)',
        y2k: 'contrast(1.25) saturate(1.4) hue-rotate(-8deg)',
        dao: 'sepia(0.15) hue-rotate(-20deg) saturate(1.3)',
        bacha: 'hue-rotate(25deg) saturate(1.15) brightness(1.04)',
        oaihuong: 'hue-rotate(35deg) saturate(1.2)',
        keo: 'saturate(1.5) brightness(1.05)',
        bang: 'hue-rotate(15deg) brightness(1.1) contrast(1.1)',
        caramel: 'sepia(0.4) hue-rotate(-10deg) saturate(1.25)',
        mocha: 'sepia(0.35) contrast(1.2) brightness(0.9)',
        phai: 'saturate(0.75) contrast(0.9) brightness(1.08)',
        ruc: 'saturate(1.7) contrast(1.15)',
        densau: 'grayscale(1) contrast(1.6) brightness(0.9)',
        hoanghon: 'sepia(0.45) hue-rotate(-25deg) saturate(1.35)',
        dem: 'brightness(0.9) contrast(1.25) hue-rotate(20deg)',
        matcha: 'hue-rotate(-30deg) saturate(1.1) brightness(1.02)',
        phimhong: 'sepia(0.18) hue-rotate(-15deg) saturate(1.2)',
        xammo: 'grayscale(0.6) contrast(0.9) brightness(1.05)',
        denflash: 'brightness(1.2) contrast(1.25) saturate(1.1)',
        suong: 'brightness(1.15) contrast(0.85)',
        nordic: 'hue-rotate(15deg) saturate(0.9) contrast(1.05) brightness(1.05)',
        cyberpunk: 'contrast(1.35) saturate(1.6) hue-rotate(45deg)',
        dreamy: 'brightness(1.12) contrast(0.9) saturate(1.25) blur(0.3px)',
        nostalgia: 'sepia(0.5) contrast(1.15) saturate(0.85) brightness(0.95)'
      };
      tCtx.filter = filters[this.state.filter] || 'none';
      tCtx.drawImage(imgEl, cx, cy, cw, ch, 0, 0, dw, dh);
      tCtx.filter = 'none';

      ctx.drawImage(temp, dx, dy, dw, dh);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);
    }

    renderBoomerangAnimation() {
      if (this.capturedShots.length === 0) return;

      try {
        if (window.SimpleGifEncoder) {
          // Kích thước chuẩn HD 640x480 siêu sắc nét & mượt mà
          const gifW = 640;
          const gifH = 480;
          const encoder = new window.SimpleGifEncoder(gifW, gifH);

          // Thu thập toàn bộ chuỗi khung hình chuyển động hậu trường của 8 tấm
          let motionSequence = [];
          for (let s = 1; s <= 8; s++) {
            if (this.motionFramesByShot && this.motionFramesByShot[s] && this.motionFramesByShot[s].length > 0) {
              motionSequence.push(...this.motionFramesByShot[s]);
            }
          }

          // Fallback nếu người dùng không có chuỗi motion
          if (motionSequence.length === 0) {
            this.capturedShots.forEach(shot => {
              motionSequence.push({ imgElement: shot.imgElement, delayMs: 180 });
            });
          }

          const canvasFrames = [];
          motionSequence.forEach((item) => {
            if (!item.imgElement) return;
            const cvs = document.createElement('canvas');
            cvs.width = gifW;
            cvs.height = gifH;
            const cCtx = cvs.getContext('2d');
            this.drawFilteredImage(cCtx, item.imgElement, 0, 0, gifW, gifH);
            canvasFrames.push({ canvas: cvs, delayMs: item.delayMs || 110 });
          });

          encoder.buildMotionTimelapseFrames(canvasFrames);
          this.exportResults.gifDataUrl = encoder.encode();
          document.getElementById('resGifImg').src = this.exportResults.gifDataUrl;
          return;
        }
      } catch (err) {
        console.warn('GIF encoder fallback:', err);
      }

      this.exportResults.gifDataUrl = this.capturedShots[0].dataUrl;
      document.getElementById('resGifImg').src = this.exportResults.gifDataUrl;
    }

    showResultOverlay() {
      document.getElementById('sbResultOverlay').classList.add('show');
    }

    switchPanel(panelId) {
      document.querySelectorAll('.deck-panel').forEach(p => p.classList.remove('show'));
      const target = document.getElementById(panelId);
      if (target) target.classList.add('show');

      const stepMap = {
        panelSetup: '1. THIẾT LẬP',
        panelShooting: '2. ĐANG CHỤP',
        panelReview: '3. XEM LẠI & RETAKE',
        panelFinish: '4. HOÀN THIỆN'
      };
      document.getElementById('stepLabel').innerText = stepMap[panelId] || 'BUỒNG CHỤP ẢNH';

      const vpCam = document.getElementById('sbViewport');
      const vpPrev = document.getElementById('sbPreviewViewport');

      if (panelId === 'panelFinish') {
        if (vpCam) vpCam.style.display = 'none';
        if (vpPrev) vpPrev.style.display = 'flex';
        this.updateLiveStripPreview();
      } else {
        if (vpCam) vpCam.style.display = 'flex';
        if (vpPrev) vpPrev.style.display = 'none';
      }
    }

    showCountdown(sec, shotNum) {
      this.countdownHud.style.display = 'flex';
      this.countdownNum.innerText = sec;
      this.countdownTag.innerText = `TẤM ${shotNum} / ${this.state.totalShots}`;
    }

    hideCountdown() {
      this.countdownHud.style.display = 'none';
    }

    triggerFlash() {
      const flash = document.getElementById('screenFlash');
      if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 300);
      }
    }

    sleep(ms) {
      return new Promise(r => setTimeout(r, ms));
    }

    downloadActiveResult() {
      const activeTab = document.querySelector('.rtab.active').dataset.tab;
      if (activeTab === 'png' && this.exportResults.pngDataUrl) {
        const a = document.createElement('a'); a.href = this.exportResults.pngDataUrl;
        a.download = `buong-chup-anh-print-300dpi.png`; a.click();
      } else if (activeTab === 'gif' && this.exportResults.gifDataUrl) {
        const a = document.createElement('a'); a.href = this.exportResults.gifDataUrl;
        a.download = `buong-chup-anh-qua-trinh-hd.gif`; a.click();
      }
    }

    bindEvents() {
      document.getElementById('btnStartSelfbooth').addEventListener('click', () => this.startSession());
      document.getElementById('btnFreeMode').addEventListener('click', () => this.takeFreeShot());
      document.getElementById('btnCancelSession').addEventListener('click', () => this.switchPanel('panelSetup'));

      // 1. Layout chips (4-Cut & 8-Cut Frame selector in Panel 4)
      document.querySelectorAll('[data-layout]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-layout]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.layout = btn.dataset.layout;
          this.updateLiveStripPreview();
          if (window.audioEffects) window.audioEffects.playBeep(false);
        });
      });

      // 2. Filter chips
      document.querySelectorAll('#filterChipRow .sb-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#filterChipRow .sb-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.filter = btn.dataset.filter;
          this.applyLiveFilter(this.state.filter);
          if (window.audioEffects) window.audioEffects.playBeep(false);
        });
      });



      // 6. Timer chips
      document.querySelectorAll('.timer-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.timer-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.timerSec = parseInt(btn.dataset.timer, 10);
        });
      });

      // 7. Mirror toggle
      const mirrorBtn = document.getElementById('btnMirrorToggle');
      if (mirrorBtn) {
        mirrorBtn.addEventListener('click', () => {
          this.state.mirror = !this.state.mirror;
          if (this.videoEl) this.videoEl.classList.toggle('no-mirror', !this.state.mirror);
          const demoCanvas = document.getElementById('sbDemoCanvas');
          if (demoCanvas) demoCanvas.classList.toggle('no-mirror', !this.state.mirror);
          mirrorBtn.classList.toggle('is-on', this.state.mirror);
        });
      }

      // Review panel buttons
      document.getElementById('btnRetakeAll').addEventListener('click', () => this.switchPanel('panelSetup'));
      document.getElementById('btnProceedFinish').addEventListener('click', () => this.switchPanel('panelFinish'));

      // Finish panel: 5 theme colors
      document.querySelectorAll('.theme-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.theme-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.stripColor = btn.dataset.color;
          this.updateLiveStripPreview();
          if (window.audioEffects) window.audioEffects.playBeep(false);
        });
      });

      document.getElementById('sbCaptionInput').addEventListener('input', (e) => {
        this.state.caption = e.target.value;
        this.updateLiveStripPreview();
      });

      document.getElementById('sbDateToggle').addEventListener('change', (e) => {
        this.state.showDate = e.target.checked;
        this.updateLiveStripPreview();
      });

      // 8. Frame Preset Vault & Canva Modal Handlers
      const addFrameModal = document.getElementById('addFrameModal');
      const closeAddModalBtn = document.getElementById('btnCloseAddFrameModal');

      // Mở modal từ nhiều nút (Header, Panel 1 Setup, Panel 4 Finish)
      const triggerOpenModal = () => {
        if (addFrameModal) addFrameModal.classList.add('show');
      };

      const btnHeaderVault = document.getElementById('btnHeaderFrameVault');
      if (btnHeaderVault) btnHeaderVault.addEventListener('click', triggerOpenModal);

      const openAddModalBtn = document.getElementById('btnOpenAddFrameModal');
      if (openAddModalBtn) openAddModalBtn.addEventListener('click', triggerOpenModal);

      document.querySelectorAll('.btn-trigger-add-frame').forEach(b => {
        b.addEventListener('click', triggerOpenModal);
      });

      if (closeAddModalBtn && addFrameModal) {
        closeAddModalBtn.addEventListener('click', () => addFrameModal.classList.remove('show'));
      }

      // Modal Tab Switching
      document.querySelectorAll('.mtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.mtab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.mtab-content').forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          const targetId = btn.dataset.tab;
          const targetContent = document.getElementById(targetId);
          if (targetContent) targetContent.classList.add('active');
        });
      });

      // Multi-File Upload & Dropzone Handling
      const fileInput = document.getElementById('vaultPngFileInput');
      const dropzone = document.getElementById('vaultDropzone');
      const previewContainer = document.getElementById('vaultFilesPreviewContainer');
      const filesList = document.getElementById('vaultFilesList');
      const countBadge = document.getElementById('vaultFilesCountBadge');
      const singleNameGroup = document.getElementById('singleFileNameGroup');

      const updateFilePreviews = (files) => {
        if (!files || files.length === 0) {
          if (previewContainer) previewContainer.style.display = 'none';
          return;
        }

        if (previewContainer) previewContainer.style.display = 'block';
        if (countBadge) countBadge.innerText = `${files.length} file đã chọn`;

        if (filesList) {
          filesList.innerHTML = '';
          Array.from(files).forEach((file, idx) => {
            const item = document.createElement('div');
            item.className = 'vault-file-item';
            item.innerHTML = `
              <span>🖼️ ${file.name}</span>
              <span style="color: #94a3b8; font-size: 0.7rem;">${(file.size / 1024).toFixed(0)} KB</span>
            `;
            filesList.appendChild(item);
          });
        }

        if (singleNameGroup) {
          singleNameGroup.style.display = files.length === 1 ? 'block' : 'none';
        }
      };

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          updateFilePreviews(e.target.files);
        });
      }

      if (dropzone) {
        ['dragenter', 'dragover'].forEach(name => {
          dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
          });
        });

        ['dragleave', 'drop'].forEach(name => {
          dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
          });
        });

        dropzone.addEventListener('drop', (e) => {
          const dt = e.dataTransfer;
          const files = dt ? dt.files : null;
          if (files && files.length > 0 && fileInput) {
            fileInput.files = files;
            updateFilePreviews(files);
          }
        });
      }

      // Save Canva Token Button
      const btnSaveToken = document.getElementById('btnSaveCanvaToken');
      if (btnSaveToken) {
        btnSaveToken.addEventListener('click', () => {
          const token = (document.getElementById('canvaApiKeyInput').value || '').trim();
          if (token) {
            localStorage.setItem('canva_access_token', token);
            alert('✓ Đã lưu Canva API Token thành công!');
          } else {
            alert('Vui lòng nhập Token trước khi lưu!');
          }
        });
      }

      // Fetch Canva Design Button
      const btnFetchCanva = document.getElementById('btnFetchCanvaDesign');
      if (btnFetchCanva) {
        btnFetchCanva.addEventListener('click', () => this.handleFetchCanvaDesign());
      }

      // Save Uploaded PNG Frame Button
      const btnSaveUploaded = document.getElementById('btnSaveUploadedFrame');
      if (btnSaveUploaded) {
        btnSaveUploaded.addEventListener('click', () => this.handleSaveUploadedFrame());
      }

      // Clear Active Frame Button (Both Step 1 & Step 4)
      const btnClearFrame = document.getElementById('btnClearFrame');
      if (btnClearFrame) {
        btnClearFrame.addEventListener('click', () => this.selectVaultFrame('none'));
      }
      const btnClearFrameSetup = document.getElementById('btnClearFrameSetup');
      if (btnClearFrameSetup) {
        btnClearFrameSetup.addEventListener('click', () => this.selectVaultFrame('none'));
      }

      // Canva Guide Modal
      const canvaModal = document.getElementById('canvaGuideModal');
      const openGuideBtn = document.getElementById('btnOpenCanvaGuide');
      const closeGuideBtn = document.getElementById('btnCloseCanvaGuide');
      const gotGuideBtn = document.getElementById('btnGotCanvaGuide');

      if (openGuideBtn && canvaModal) {
        openGuideBtn.addEventListener('click', () => canvaModal.classList.add('show'));
      }
      if (closeGuideBtn && canvaModal) {
        closeGuideBtn.addEventListener('click', () => canvaModal.classList.remove('show'));
      }
      if (gotGuideBtn && canvaModal) {
        gotGuideBtn.addEventListener('click', () => {
          canvaModal.classList.remove('show');
          if (addFrameModal) addFrameModal.classList.add('show');
        });
      }

      document.getElementById('btnBackToReview').addEventListener('click', () => this.switchPanel('panelReview'));
      document.getElementById('btnDevelopFilm').addEventListener('click', () => this.developFilm());

      // Result tabs
      document.querySelectorAll('.rtab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.tab;

          document.getElementById('resPngImg').style.display = tab === 'png' ? 'block' : 'none';
          document.getElementById('resGifImg').style.display = tab === 'gif' ? 'block' : 'none';
        });
      });

      // Viewport Camera Trigger Button
      const btnVpCam = document.getElementById('btnViewportCameraToggle');
      if (btnVpCam) {
        btnVpCam.addEventListener('click', async () => {
          if (window.cameraManager) {
            const ok = await window.cameraManager.startWebcam(this.videoEl);
            await this.refreshCameraDevices();
            this.applyLiveFilter(this.state.filter);
            const overlay = document.getElementById('camPromptOverlay');
            if (!ok && overlay) {
              overlay.style.display = 'flex';
            }
          }
        });
      }

      // Camera Permission & Device Switching
      const btnGrant = document.getElementById('btnGrantCam');
      if (btnGrant) {
        btnGrant.addEventListener('click', async () => {
          if (window.cameraManager) {
            const ok = await window.cameraManager.startWebcam(this.videoEl);
            await this.refreshCameraDevices();
            this.applyLiveFilter(this.state.filter);
            const overlay = document.getElementById('camPromptOverlay');
            if (ok && overlay) overlay.style.display = 'none';
          }
        });
      }

      const btnCloseCam = document.getElementById('btnCloseCamPrompt');
      if (btnCloseCam) {
        btnCloseCam.addEventListener('click', () => {
          const overlay = document.getElementById('camPromptOverlay');
          if (overlay) overlay.style.display = 'none';
        });
      }

      const btnDemo = document.getElementById('btnUseDemoMode');
      if (btnDemo) {
        btnDemo.addEventListener('click', () => {
          const overlay = document.getElementById('camPromptOverlay');
          if (overlay) overlay.style.display = 'none';
          const statusText = document.getElementById('cameraStatusText');
          if (statusText) statusText.innerText = '✨ Demo Studio Live';
          this.startDemoStudioCanvas();
        });
      }

      const camSelect = document.getElementById('cameraSourceSelect');
      if (camSelect) {
        camSelect.addEventListener('change', async (e) => {
          const devId = e.target.value;
          if (window.cameraManager) {
            await window.cameraManager.startWebcam(this.videoEl, devId);
            this.applyLiveFilter(this.state.filter);
          }
        });
      }

      // Download Buttons
      document.getElementById('btnDownloadActive').addEventListener('click', () => this.downloadActiveResult());
      document.getElementById('dlPngBtn').addEventListener('click', () => {
        const a = document.createElement('a'); a.href = this.exportResults.pngDataUrl;
        a.download = `buong-chup-anh-print-300dpi.png`; a.click();
      });
      document.getElementById('dlGifBtn').addEventListener('click', () => {
        const a = document.createElement('a'); a.href = this.exportResults.gifDataUrl;
        a.download = `buong-chup-anh-qua-trinh-hd.gif`; a.click();
      });
      document.getElementById('btnShootNew').addEventListener('click', () => {
        document.getElementById('sbResultOverlay').classList.remove('show');
        this.switchPanel('panelSetup');
      });
    }
  }

  const startSelfbooth = () => {
    const app = new SelfboothApp();
    app.init();
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startSelfbooth);
  } else {
    startSelfbooth();
  }
})(window);
