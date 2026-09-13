/**
 * 50 FILM & AESTHETIC FILTER COLOR GRADING ENGINE
 */

(function(window) {
  const FILTER_MAP = {
    // 1. Phim Analog & Retro 35mm
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
    phim: 'sepia(0.2) saturate(1.15) contrast(1.05)',
    hoaico: 'sepia(0.4) contrast(1.1) brightness(0.95)',
    phai: 'saturate(0.75) contrast(0.9) brightness(1.08)',
    nostalgia: 'sepia(0.5) contrast(1.15) saturate(0.85) brightness(0.95)',

    // 2. Tone Da & Làm Đẹp Chân Dung (Portrait Glow)
    minda: 'brightness(1.08) contrast(0.95) saturate(1.1)',
    honghao: 'sepia(0.15) hue-rotate(-14deg) saturate(1.3) brightness(1.03)',
    dasu: 'brightness(1.1) contrast(1.02) saturate(1.05)',
    trongveo: 'brightness(1.08) contrast(1.1) saturate(1.15)',
    seoul: 'brightness(1.12) contrast(1.05) saturate(1.15) hue-rotate(-6deg)',
    nang: 'sepia(0.25) brightness(1.1) saturate(1.2)',
    dao: 'sepia(0.15) hue-rotate(-20deg) saturate(1.3)',
    caramel: 'sepia(0.4) hue-rotate(-10deg) saturate(1.25)',
    mocha: 'sepia(0.35) contrast(1.2) brightness(0.9)',
    pastel: 'brightness(1.08) saturate(0.88) contrast(0.95)',
    suong: 'brightness(1.15) contrast(0.85)',
    dreamy: 'brightness(1.12) contrast(0.9) saturate(1.25) blur(0.3px)',
    mo: 'blur(0.5px) brightness(1.08) contrast(0.92)',

    // 3. Màu Nghệ Thuật & Trend Gen Z
    y2k: 'contrast(1.25) saturate(1.4) hue-rotate(-8deg)',
    tokyo: 'hue-rotate(22deg) saturate(1.15) brightness(1.08) contrast(0.98)',
    paris: 'sepia(0.35) hue-rotate(-20deg) saturate(1.28) brightness(1.02)',
    hoanghon: 'sepia(0.45) hue-rotate(-25deg) saturate(1.35)',
    bacha: 'hue-rotate(25deg) saturate(1.15) brightness(1.04)',
    matcha: 'hue-rotate(-30deg) saturate(1.1) brightness(1.02)',
    oaihuong: 'hue-rotate(35deg) saturate(1.2)',
    keo: 'saturate(1.5) brightness(1.05)',
    bang: 'hue-rotate(15deg) brightness(1.1) contrast(1.1)',
    lanh: 'hue-rotate(18deg) saturate(1.1) brightness(1.02)',
    am: 'sepia(0.3) saturate(1.25) brightness(1.05)',
    ruc: 'saturate(1.7) contrast(1.15)',
    dam: 'contrast(1.3) saturate(1.35)',
    bw: 'grayscale(1) contrast(1.3)',
    densau: 'grayscale(1) contrast(1.6) brightness(0.9)',
    dem: 'brightness(0.9) contrast(1.25) hue-rotate(20deg)',
    phimhong: 'sepia(0.18) hue-rotate(-15deg) saturate(1.2)',
    xammo: 'grayscale(0.6) contrast(0.9) brightness(1.05)',
    denflash: 'brightness(1.2) contrast(1.25) saturate(1.1)',
    nordic: 'hue-rotate(15deg) saturate(0.9) contrast(1.05) brightness(1.05)',
    cyberpunk: 'contrast(1.35) saturate(1.6) hue-rotate(45deg)'
  };

  const FilterEngine = {
    getFilterCSS(filterKey) {
      return FILTER_MAP[filterKey] || 'none';
    },

    drawFilteredImage(ctx, imgEl, dx, dy, dw, dh, filterKey = 'goc') {
      const temp = document.createElement('canvas');
      temp.width = dw;
      temp.height = dh;
      const tCtx = temp.getContext('2d');

      const sw = imgEl.width || imgEl.naturalWidth || 640;
      const sh = imgEl.height || imgEl.naturalHeight || 480;
      const aspect = dw / dh;

      let cw = sw, ch = sw / aspect, cx = 0, cy = (sh - ch) / 2;
      if (ch > sh) {
        ch = sh;
        cw = sh * aspect;
        cy = 0;
        cx = (sw - cw) / 2;
      }

      tCtx.filter = this.getFilterCSS(filterKey);
      tCtx.drawImage(imgEl, cx, cy, cw, ch, 0, 0, dw, dh);
      tCtx.filter = 'none';

      ctx.drawImage(temp, dx, dy, dw, dh);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);
    }
  };

  window.FilterEngine = FilterEngine;
})(window);
