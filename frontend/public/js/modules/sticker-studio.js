/**
 * STICKER STUDIO & DOODLE INTERACTION MODULE
 * Safe DOM rendering, multi-touch drag-drop, rotation, and custom text stamps.
 */

(function(window) {
  const STICKER_CATALOG = {
    y2k: [
      { type: 'emoji', content: '🎀' },
      { type: 'emoji', content: '💖' },
      { type: 'emoji', content: '✨' },
      { type: 'emoji', content: '🪞' },
      { type: 'emoji', content: '🪩' },
      { type: 'emoji', content: '🦋' },
      { type: 'emoji', content: '🍬' },
      { type: 'emoji', content: '🍒' },
      { type: 'emoji', content: '🧸' },
      { type: 'emoji', content: '👑' },
      { type: 'emoji', content: '💄' },
      { type: 'emoji', content: '🕶️' },
      { type: 'emoji', content: '💅' },
      { type: 'emoji', content: '🧚‍♀️' },
      { type: 'emoji', content: '💌' },
      { type: 'emoji', content: '🌸' },
      { type: 'emoji', content: '💫' },
      { type: 'emoji', content: '🤍' }
    ],
    pets: [
      { type: 'emoji', content: '🐱' },
      { type: 'emoji', content: '🐶' },
      { type: 'emoji', content: '🐰' },
      { type: 'emoji', content: '🐻' },
      { type: 'emoji', content: '🐼' },
      { type: 'emoji', content: '🦊' },
      { type: 'emoji', content: '🐹' },
      { type: 'emoji', content: '🐥' },
      { type: 'emoji', content: '🐾' },
      { type: 'emoji', content: '🦄' },
      { type: 'emoji', content: '🦦' },
      { type: 'emoji', content: '🐧' },
      { type: 'emoji', content: '🐳' },
      { type: 'emoji', content: '🍀' },
      { type: 'emoji', content: '🍓' },
      { type: 'emoji', content: '🍑' },
      { type: 'emoji', content: '🍩' },
      { type: 'emoji', content: '🍰' }
    ],
    badges: [
      { type: 'badge', content: 'LIFE4CUTS', bg: '#1c1917', color: '#f59e0b' },
      { type: 'badge', content: '★ BESTIES ★', bg: '#ec4899', color: '#ffffff' },
      { type: 'badge', content: 'LOVE STORY', bg: '#ef4444', color: '#ffffff' },
      { type: 'badge', content: 'MEMORIES', bg: '#3b82f6', color: '#ffffff' },
      { type: 'badge', content: '35MM FILM', bg: '#d97706', color: '#1c1917' },
      { type: 'badge', content: 'PHOTO DUMP', bg: '#10b981', color: '#ffffff' },
      { type: 'badge', content: 'FOREVER YOUNG', bg: '#8b5cf6', color: '#ffffff' },
      { type: 'badge', content: 'Y2K VIBES', bg: '#f43f5e', color: '#ffffff' },
      { type: 'badge', content: '✦ 2026 ARCHIVE ✦', bg: '#18181b', color: '#e4e4e7' },
      { type: 'badge', content: 'CUTE AF', bg: '#fb7185', color: '#ffffff' },
      { type: 'badge', content: 'SWEETHEART', bg: '#f472b6', color: '#ffffff' },
      { type: 'badge', content: 'BARCODE 35MM', bg: '#000000', color: '#ffffff' }
    ],
    sparkles: [
      { type: 'emoji', content: '✦' },
      { type: 'emoji', content: '✧' },
      { type: 'emoji', content: '★' },
      { type: 'emoji', content: '☆' },
      { type: 'emoji', content: '⚡' },
      { type: 'emoji', content: '🔥' },
      { type: 'emoji', content: '🎵' },
      { type: 'emoji', content: '🫧' },
      { type: 'emoji', content: '🪐' },
      { type: 'emoji', content: '⛅' },
      { type: 'emoji', content: '🌈' },
      { type: 'emoji', content: '💐' },
      { type: 'emoji', content: '🌷' },
      { type: 'emoji', content: '🌿' },
      { type: 'emoji', content: '🎉' },
      { type: 'emoji', content: '🎈' },
      { type: 'emoji', content: '☕' },
      { type: 'emoji', content: '💎' }
    ]
  };

  class StickerStudio {
    constructor(store) {
      this.store = store || window.sessionStore;
      this.overlayEl = null;
      this.pickerGridEl = null;
    }

    init(overlayId = 'stickerInteractiveOverlay', pickerGridId = 'stickerPickerGrid') {
      this.overlayEl = document.getElementById(overlayId);
      this.pickerGridEl = document.getElementById(pickerGridId);

      this.renderPalette('y2k');
      this.bindOverlayEvents();
    }

    renderPalette(cat = 'y2k') {
      if (!this.pickerGridEl) return;
      this.pickerGridEl.textContent = ''; // Safe clear

      const items = STICKER_CATALOG[cat] || STICKER_CATALOG.y2k;
      const S = window.Sanitizer;

      items.forEach(item => {
        const isBadge = item.type === 'badge';
        const btn = S.createElement('button', {
          className: `sticker-pick-item ${isBadge ? 'badge-style' : ''}`,
          style: isBadge ? { background: item.bg, color: item.color } : {},
          onClick: () => this.addNewSticker(item)
        }, item.content);

        this.pickerGridEl.appendChild(btn);
      });
    }

    addNewSticker(item) {
      const jitterX = (Math.random() - 0.5) * 0.15;
      const jitterY = (Math.random() - 0.5) * 0.15;

      const newStk = {
        id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: item.type,
        content: item.content,
        bg: item.bg || '#1c1917',
        color: item.color || '#ffffff',
        x: Math.max(0.15, Math.min(0.85, 0.5 + jitterX)),
        y: Math.max(0.15, Math.min(0.85, 0.5 + jitterY)),
        scale: 1.0,
        rotation: Math.floor((Math.random() - 0.5) * 20)
      };

      this.store.addSticker(newStk);
      this.renderInteractiveOverlay();
      if (window.audioEffects) window.audioEffects.playBeep(false);
    }

    addCustomText(rawText, font = 'font-serif', color = '#ffffff') {
      if (!rawText || !rawText.trim()) return;

      const safeText = window.Sanitizer.escapeHTML(rawText.trim());

      const newTextStk = {
        id: 'text_' + Date.now(),
        type: 'text',
        content: safeText,
        font: font || 'font-serif',
        color: color || '#ffffff',
        x: 0.5,
        y: 0.5 + (Math.random() - 0.5) * 0.1,
        scale: 1.0,
        rotation: 0
      };

      this.store.addSticker(newTextStk);
      this.renderInteractiveOverlay();
      if (window.audioEffects) window.audioEffects.playBeep(false);
    }

    renderInteractiveOverlay() {
      if (!this.overlayEl) return;
      this.overlayEl.textContent = ''; // Safe clear

      const state = this.store.getState();
      const stickers = state.stickers || [];

      const countBadge = document.getElementById('stickerCountBadge');
      if (countBadge) {
        countBadge.textContent = `${stickers.length} sticker`;
      }

      const S = window.Sanitizer;

      stickers.forEach(stk => {
        const isActive = state.activeStickerId === stk.id;

        // Content element
        let contentEl;
        if (stk.type === 'emoji') {
          contentEl = S.createElement('div', {
            className: 'sticker-content',
            style: { fontSize: '2.2rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }
          }, stk.content);
        } else if (stk.type === 'badge') {
          contentEl = S.createElement('div', {
            className: 'sticker-content',
            style: {
              background: stk.bg,
              color: stk.color,
              border: `1.5px solid ${stk.color}`,
              padding: '4px 10px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: '800',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }
          }, stk.content);
        } else {
          contentEl = S.createElement('div', {
            className: `sticker-content ${stk.font}`,
            style: {
              color: stk.color,
              fontSize: '1.1rem',
              fontWeight: '800',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 2px #000'
            }
          }, stk.content);
        }

        // Control buttons
        const rotBtn = S.createElement('button', {
          className: 'st-ctrl-btn btn-rotate',
          title: 'Xoay'
        }, '🔄');

        const delBtn = S.createElement('button', {
          className: 'st-ctrl-btn btn-delete',
          title: 'Xóa'
        }, '✕');

        const controlsWrap = S.createElement('div', {
          className: 'sticker-controls'
        }, [rotBtn, delBtn]);

        // Main Item Wrapper
        const itemEl = S.createElement('div', {
          className: `sticker-item ${isActive ? 'active' : ''}`,
          style: {
            left: `${stk.x * 100}%`,
            top: `${stk.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${stk.rotation || 0}deg) scale(${stk.scale || 1})`
          }
        }, [contentEl, controlsWrap]);

        // Pointer Drag Events
        itemEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          state.activeStickerId = stk.id;
          document.querySelectorAll('.sticker-item').forEach(el => el.classList.remove('active'));
          itemEl.classList.add('active');

          const overlayRect = this.overlayEl.getBoundingClientRect();
          const startPointerX = e.clientX;
          const startPointerY = e.clientY;
          const startStkX = stk.x;
          const startStkY = stk.y;

          const onPointerMove = (ev) => {
            const dx = (ev.clientX - startPointerX) / overlayRect.width;
            const dy = (ev.clientY - startPointerY) / overlayRect.height;
            stk.x = Math.max(0.04, Math.min(0.96, startStkX + dx));
            stk.y = Math.max(0.04, Math.min(0.96, startStkY + dy));
            itemEl.style.left = `${stk.x * 100}%`;
            itemEl.style.top = `${stk.y * 100}%`;
          };

          const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            // Request canvas refresh
            if (window.selfboothApp) window.selfboothApp.updateLivePreview();
          };

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
        });

        // Rotate Action
        rotBtn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          stk.rotation = ((stk.rotation || 0) + 20) % 360;
          itemEl.style.transform = `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale || 1})`;
          if (window.selfboothApp) window.selfboothApp.updateLivePreview();
        });

        // Delete Action
        delBtn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.store.removeSticker(stk.id);
          this.renderInteractiveOverlay();
          if (window.selfboothApp) window.selfboothApp.updateLivePreview();
        });

        this.overlayEl.appendChild(itemEl);
      });
    }

    bindOverlayEvents() {
      if (!this.overlayEl) return;
      this.overlayEl.onclick = (e) => {
        if (e.target === this.overlayEl) {
          const state = this.store.getState();
          state.activeStickerId = null;
          document.querySelectorAll('.sticker-item').forEach(el => el.classList.remove('active'));
        }
      };
    }
  }

  window.StickerStudio = StickerStudio;
})(window);
