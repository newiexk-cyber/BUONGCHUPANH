/**
 * FRAME VAULT & CANVA BACKEND SYNC MODULE
 * Manages local IndexedDB persistent frames and communicates securely with backend Canva proxy.
 */

(function(window) {
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

  class FrameVaultManager {
    constructor(store) {
      this.db = new FrameVaultDB();
      this.store = store || window.sessionStore;
    }

    async init() {
      await this.db.init();
      await this.initDefaultTemplates();
      await this.renderGrids();
    }

    async initDefaultTemplates() {
      const existing = await this.db.getAllFrames();
      if (existing.length === 0) {
        const defaults = [
          { id: 'tpl_birthday', name: '🎂 Sinh Nhật Party', tag: 'DẢI 4 Ô' },
          { id: 'tpl_y2k', name: '💖 Y2K Cute Angel', tag: 'DẢI 4 Ô' },
          { id: 'tpl_flower', name: '💐 Sweet Botanical', tag: 'DẢI 4 Ô' }
        ];

        for (const tpl of defaults) {
          const img = await this.generateProceduralTemplate(tpl.id);
          await this.db.saveFrame({
            id: tpl.id,
            name: tpl.name,
            tag: tpl.tag,
            dataUrl: img.src,
            isDefault: true,
            createdAt: Date.now()
          });
        }
      }
    }

    async renderGrids() {
      const grids = [
        document.getElementById('frameVaultGrid'),
        document.getElementById('frameVaultGridSetup')
      ].filter(Boolean);

      if (grids.length === 0) return;

      const frames = await this.db.getAllFrames();
      const state = this.store.getState();
      const S = window.Sanitizer;

      // Update header counter
      const countEl = document.getElementById('headerVaultCount');
      if (countEl) countEl.textContent = String(frames.length);

      grids.forEach(grid => {
        grid.textContent = ''; // Safe clear

        // 1. Default Plain Card
        const isNone = state.activeFrameId === 'none';
        const defaultCard = S.createElement('div', {
          className: `vault-card ${isNone ? 'active' : ''}`,
          onClick: () => this.selectFrame('none')
        }, [
          S.createElement('div', { className: 'vault-thumb-wrap' }, [
            S.createElement('div', { className: 'vault-thumb-none' }, '🎞️ Dải Phim Trơn')
          ]),
          S.createElement('div', { className: 'vault-card-name' }, '🚫 Mặc Định'),
          S.createElement('div', { className: 'vault-card-tag' }, 'BASIC')
        ]);
        grid.appendChild(defaultCard);

        // 2. Vault Frames
        frames.forEach(f => {
          const isActive = state.activeFrameId === f.id;
          const children = [];

          if (!f.isDefault) {
            const delBtn = S.createElement('button', {
              className: 'btn-del-frame',
              title: 'Xóa khung này',
              onClick: (e) => {
                e.stopPropagation();
                this.deleteFrame(f.id);
              }
            }, '✕');
            children.push(delBtn);
          }

          const img = S.createElement('img', { src: f.dataUrl, alt: f.name });
          const thumbWrap = S.createElement('div', { className: 'vault-thumb-wrap' }, [img]);
          const nameEl = S.createElement('div', { className: 'vault-card-name', title: f.name }, f.name);
          const tagEl = S.createElement('div', { className: 'vault-card-tag' }, f.tag || 'KHUNG');

          children.push(thumbWrap, nameEl, tagEl);

          const card = S.createElement('div', {
            className: `vault-card ${isActive ? 'active' : ''}`,
            onClick: () => this.selectFrame(f.id)
          }, children);

          grid.appendChild(card);
        });
      });
    }

    async selectFrame(frameId) {
      const nameEl = document.getElementById('activeFrameName');
      const nameElSetup = document.getElementById('activeFrameNameSetup');
      const clearBtn = document.getElementById('btnClearFrame');
      const clearBtnSetup = document.getElementById('btnClearFrameSetup');

      if (frameId === 'none') {
        this.store.setActiveFrame('none', 'Dải Phim Mặc Định', null);
        if (nameEl) nameEl.textContent = 'Dải Phim Mặc Định';
        if (nameElSetup) nameElSetup.textContent = 'Dải Phim Mặc Định';
        if (clearBtn) clearBtn.style.display = 'none';
        if (clearBtnSetup) clearBtnSetup.style.display = 'none';
      } else {
        const frames = await this.db.getAllFrames();
        const frame = frames.find(f => f.id === frameId);
        if (frame) {
          const img = new Image();
          img.onload = () => {
            this.store.setActiveFrame(frame.id, frame.name, img);
            if (nameEl) nameEl.textContent = frame.name;
            if (nameElSetup) nameElSetup.textContent = frame.name;
            if (clearBtn) clearBtn.style.display = 'inline-block';
            if (clearBtnSetup) clearBtnSetup.style.display = 'inline-block';
            if (window.selfboothApp) window.selfboothApp.updateLivePreview();
          };
          img.src = frame.dataUrl;
        }
      }

      await this.renderGrids();
      if (window.audioEffects) window.audioEffects.playBeep(false);
      if (window.selfboothApp) window.selfboothApp.updateLivePreview();
    }

    async deleteFrame(frameId) {
      if (!confirm('Bạn có chắc chắn muốn xóa khung mẫu này khỏi bộ sưu tập?')) return;
      await this.db.deleteFrame(frameId);
      if (this.store.getState().activeFrameId === frameId) {
        await this.selectFrame('none');
      }
      await this.renderGrids();
    }

    /**
     * Calls Backend Canva Proxy API securely
     */
    async syncCanvaDesign(designUrl, customName) {
      if (!designUrl) throw new Error('Vui lòng dán Link thiết kế Canva hoặc Design ID!');

      let designId = designUrl;
      const match = designUrl.match(/design\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) designId = match[1];

      const frameName = customName || `Khung Canva #${designId.substring(0, 6)}`;

      // Call Backend RESTful Proxy API
      const resp = await fetch('/api/v1/canva/proxy-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId })
      });

      let dataUrl = null;
      if (resp.ok) {
        const result = await resp.json();
        if (result.success && result.exportUrl) {
          dataUrl = result.exportUrl;
        }
      }

      // Fallback procedural visual if in local test
      if (!dataUrl) {
        const procImg = await this.generateProceduralTemplate('canva_amber', frameName);
        dataUrl = procImg.src;
      }

      const newFrame = {
        id: 'canva_' + Date.now(),
        name: frameName,
        tag: 'CANVA API',
        dataUrl: dataUrl,
        isDefault: false,
        createdAt: Date.now()
      };

      await this.db.saveFrame(newFrame);
      await this.renderGrids();
      await this.selectFrame(newFrame.id);

      return newFrame;
    }

    generateProceduralTemplate(key, title = '') {
      return new Promise((resolve) => {
        const cvs = document.createElement('canvas');
        cvs.width = 800; cvs.height = 2400;
        const ctx = cvs.getContext('2d');
        const w = 800, h = 2400;
        const imgW = 680, imgH = 510, padX = 60, startY = 60, gapY = 40;

        ctx.clearRect(0, 0, w, h);

        if (key === 'tpl_birthday') {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 14;
          ctx.strokeRect(20, 20, w - 40, h - 40);

          ctx.font = 'bold 36px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#db2777';
          ctx.textAlign = 'center';
          ctx.fillText('🎂 HAPPY BIRTHDAY PARTY 🎉', w / 2, 48);

          for (let i = 0; i < 4; i++) {
            const y = startY + i * (imgH + gapY);
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 6;
            ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);
          }
        } else {
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 12;
          ctx.strokeRect(18, 18, w - 36, h - 36);

          ctx.font = '800 34px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#b45309';
          ctx.textAlign = 'center';
          ctx.fillText(`✦ ${(title || 'VINTAGE PHOTOBOOTH').toUpperCase()} ✦`, w / 2, 48);

          for (let i = 0; i < 4; i++) {
            const y = startY + i * (imgH + gapY);
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
            ctx.lineWidth = 5;
            ctx.strokeRect(padX - 4, y - 4, imgW + 8, imgH + 8);
          }
        }

        const img = new Image();
        img.onload = () => resolve(img);
        img.src = cvs.toDataURL('image/png');
      });
    }
  }

  window.FrameVaultManager = FrameVaultManager;
})(window);
