/**
 * CENTRALIZED SESSION STATE STORE
 * Manages entire studio lifecycle with structured state machine and change listeners.
 */

(function(window) {
  // Studio Lifecycle Phases
  const StudioPhase = {
    SETUP: 'SETUP',
    SHOOTING: 'SHOOTING',
    REVIEW: 'REVIEW',
    CUSTOMIZE: 'CUSTOMIZE',
    DEVELOPING: 'DEVELOPING',
    RESULT: 'RESULT'
  };

  class SessionStore {
    constructor() {
      // 1. Centralized Global State Tree (Defined at top of store)
      this.state = {
        // Lifecycle Phase
        phase: StudioPhase.SETUP,
        sessionId: null,

        // Capture Configuration
        config: {
          layout: 'strip-4',
          totalShots: 8,
          filter: 'goc',
          timerSec: 3,
          mirror: true,
          stripColor: '#0c0c0e',
          caption: 'MÈO BÉO & HỘI BẠN THÂN',
          showDate: true,
          dateStyle: 'orange-film'
        },

        // Capture Data
        capturedShots: [],
        motionFramesByShot: {},
        isShooting: false,
        retakeIndex: null,

        // Frame Customization
        activeFrameId: 'none',
        activeFrameName: 'Dải Phim Mặc Định',
        customFrameImage: null,

        // Sticker & Text Customization
        stickers: [],
        activeStickerId: null,
        currentStickerCat: 'y2k',
        selectedTextColor: '#ffffff',
        selectedTextFont: 'font-serif',

        // Export Results
        exportResults: {
          pngDataUrl: null,
          gifDataUrl: null
        }
      };

      this.listeners = new Set();
    }

    // Subscribe to state mutations
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    notify(changedKeys = []) {
      this.listeners.forEach(fn => {
        try {
          fn(this.state, changedKeys);
        } catch (e) {
          console.warn('SessionStore listener error:', e);
        }
      });
    }

    getState() {
      return this.state;
    }

    setPhase(newPhase) {
      if (this.state.phase !== newPhase) {
        this.state.phase = newPhase;
        this.notify(['phase']);
      }
    }

    updateConfig(partialConfig) {
      Object.assign(this.state.config, partialConfig);
      this.notify(['config']);
    }

    setCapturedShots(shots) {
      this.state.capturedShots = shots;
      this.notify(['capturedShots']);
    }

    updateSingleShot(index, shotData) {
      this.state.capturedShots[index] = shotData;
      this.notify(['capturedShots']);
    }

    setStickers(stickers) {
      this.state.stickers = stickers;
      this.notify(['stickers']);
    }

    addSticker(sticker) {
      this.state.stickers.push(sticker);
      this.state.activeStickerId = sticker.id;
      this.notify(['stickers', 'activeStickerId']);
    }

    removeSticker(stickerId) {
      this.state.stickers = this.state.stickers.filter(s => s.id !== stickerId);
      if (this.state.activeStickerId === stickerId) {
        this.state.activeStickerId = null;
      }
      this.notify(['stickers', 'activeStickerId']);
    }

    clearStickers() {
      this.state.stickers = [];
      this.state.activeStickerId = null;
      this.notify(['stickers', 'activeStickerId']);
    }

    setActiveFrame(frameId, frameName, imgElement) {
      this.state.activeFrameId = frameId;
      this.state.activeFrameName = frameName;
      this.state.customFrameImage = imgElement;
      this.notify(['activeFrameId', 'activeFrameName', 'customFrameImage']);
    }

    setExportResults(pngUrl, gifUrl) {
      this.state.exportResults.pngDataUrl = pngUrl;
      this.state.exportResults.gifDataUrl = gifUrl;
      this.notify(['exportResults']);
    }

    resetForNewSession() {
      this.state.phase = StudioPhase.SETUP;
      this.state.capturedShots = [];
      this.state.motionFramesByShot = {};
      this.state.isShooting = false;
      this.state.retakeIndex = null;
      this.state.stickers = [];
      this.state.activeStickerId = null;
      this.state.exportResults = { pngDataUrl: null, gifDataUrl: null };
      this.notify(['phase', 'capturedShots', 'stickers', 'exportResults']);
    }
  }

  window.StudioPhase = StudioPhase;
  window.SessionStore = SessionStore;
  window.sessionStore = new SessionStore();
})(window);
