'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import api from '../../services/api';

// --- 50MM ANALOG & PORTRAIT COLOR GRADING PRESETS ---
const FILTER_CSS_MAP = {
  goc: 'none',
  kodak200: 'sepia(0.25) saturate(1.28) contrast(1.08) brightness(1.04)',
  fuji400: 'sepia(0.08) hue-rotate(12deg) saturate(1.18) brightness(1.06) contrast(1.02)',
  cinestill: 'sepia(0.18) hue-rotate(-18deg) saturate(1.35) contrast(1.15) brightness(1.02)',
  portra400: 'sepia(0.22) saturate(1.25) contrast(1.06) brightness(1.03)',
  ilford: 'grayscale(1) contrast(1.25) brightness(1.02)',
  minda: 'brightness(1.08) contrast(0.95) saturate(1.12)',
  trongveo: 'brightness(1.08) contrast(1.1) saturate(1.15)',
  honghao: 'sepia(0.15) hue-rotate(-14deg) saturate(1.3) brightness(1.03)',
  y2k: 'contrast(1.25) saturate(1.4) hue-rotate(-8deg)'
};

const getFilterCSS = (fId) => FILTER_CSS_MAP[fId] || 'none';

// --- FRAME BACKGROUND PALETTES ---
const FRAME_COLORS = [
  { id: 'black', label: 'Đen Noir', hex: '#0c0c0e', border: '#3f3f46' },
  { id: 'cream', label: 'Trắng Kem', hex: '#f6f5f0', border: '#e4e4e7', darkText: true },
  { id: 'pink', label: 'Hồng Y2K', hex: '#fce7f3', border: '#f472b6', darkText: true },
  { id: 'wine', label: 'Đỏ Rượu', hex: '#450a0a', border: '#991b1b' },
  { id: 'sage', label: 'Xanh Sage', hex: '#14532d', border: '#22c55e' },
  { id: 'cyber', label: 'Xanh Cyber', hex: '#1e1b4b', border: '#6366f1' },
  { id: 'amber', label: 'Vàng Amber', hex: '#78350f', border: '#f59e0b' }
];

// --- STUDIO LAYOUT PRESETS ---
const LAYOUT_OPTIONS = [
  { id: 'strip-4', label: '📱 Dải Dọc 4 Ô', slots: 4, desc: 'Dải film chuẩn 4-Cut Hàn Quốc (800x2400)' },
  { id: 'grid-4', label: '🔲 Lưới Vuông 4 Ô', slots: 4, desc: 'Bố cục 2x2 Polaroid vuông (1600x1600)' },
  { id: 'strip-3', label: '🎞️ Dải Dọc 3 Ô', slots: 3, desc: '3 ô phong cách tạp chí nghệ thuật' },
  { id: 'strip-2', label: '📸 Dải Đôi 2 Ô', slots: 2, desc: '2 ảnh lớn chân dung sắc nét' }
];

export default function StudioPage() {
  // Studio Lifecycle Phase: 'SETUP' | 'SHOOTING' | 'REVIEW' | 'DEVELOPING' | 'RESULT'
  const [phase, setPhase] = useState('SETUP');
  
  // Camera & Devices
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isMirror, setIsMirror] = useState(true);
  const [timerSec, setTimerSec] = useState(3);

  // Filters & Layouts & Frames
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('goc');
  const [layout, setLayout] = useState('strip-4');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('tpl_zumppi');
  const [frameColor, setFrameColor] = useState('#0c0c0e');

  // Shooting & Frames Data
  const [shots, setShots] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [flashing, setFlashing] = useState(false);

  // Result & Export
  const [resultPng, setResultPng] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState('dual-2x6');
  const [flashTriggerEnabled, setFlashTriggerEnabled] = useState(true);

  // DOM Refs
  const videoRef = useRef(null);
  const demoCanvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const printStageRef = useRef(null);

  // 1. Initialize Filters, Templates & Cameras on Mount
  useEffect(() => {
    loadFilters();
    loadTemplates();
    initCameraList();
    startDemoAnimation();

    const handleDeviceChange = () => {
      initCameraList();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      stopCameraStream();
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      if (data && data.data && data.data.length > 0) {
        setTemplates(data.data.filter(t => t.isActive));
        return;
      }
    } catch (e) {}
    setTemplates([
      { id: 'tpl_zumppi', name: 'Zump.pi Noir Signature', tag: 'CLASSIC', slots: 4 },
      { id: 'tpl_birthday', name: '🎂 Sinh Nhật Party', tag: 'PARTY', slots: 4 },
      { id: 'tpl_y2k', name: '✨ Y2K Cyber Angel', tag: 'GEN-Z', slots: 4 },
      { id: 'tpl_sweet', name: '💐 Sweet Botanical', tag: 'PASTEL', slots: 4 },
      { id: 'tpl_retro', name: '🎞️ Vintage 35mm Analog', tag: 'RETRO', slots: 4 }
    ]);
  };

  const loadFilters = async () => {
    try {
      const data = await api.getFilters();
      if (data && data.data && data.data.length > 0) {
        setFilters(data.data.filter(f => f.isActive));
        return;
      }
    } catch (e) {}
    setFilters([
      { id: 'goc', name: 'Gốc (Raw)' },
      { id: 'kodak200', name: '🎞️ Kodak Gold 200' },
      { id: 'fuji400', name: '🌿 Fuji Pro 400H' },
      { id: 'cinestill', name: '🎬 CineStill 800T' },
      { id: 'portra400', name: '🌸 Portra 400' },
      { id: 'ilford', name: '🖤 Ilford B&W' },
      { id: 'minda', name: '✨ Mịn Da Hàn Quốc' },
      { id: 'trongveo', name: '💎 Trong Veo' },
      { id: 'honghao', name: '🍑 Hồng Hào' },
      { id: 'y2k', name: '⚡ Y2K Glow' }
    ]);
  };

  const initCameraList = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);

      if (videoInputs.length > 0) {
        startCamera(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Camera enumeration error:', err);
    }
  };

  const startCamera = async (deviceId) => {
    stopCameraStream();
    setCameraError('');

    try {
      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setSelectedDeviceId(deviceId);
      }
    } catch (err) {
      console.warn('Webcam stream error, using Demo Mode fallback:', err.message);
      setCameraActive(false);
      setCameraError(err.message);
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Demo Mode Animated Studio Canvas fallback (never pitch black)
  const startDemoAnimation = () => {
    const canvas = demoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    const render = () => {
      if (cameraActive) return;
      t += 0.04;
      const w = 640;
      const h = 480;
      canvas.width = w;
      canvas.height = h;

      // Studio gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Spotlight glow
      const spot = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, w * 0.4);
      spot.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
      spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      const hX = w / 2 + Math.sin(t * 1.2) * 6;
      const hY = h * 0.42 + Math.cos(t) * 4;

      // Silhouette avatar
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(hX, hY - 10, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(hX, h * 0.82, 110, 70, 0, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(render);
    };

    render();
  };

  // Wireless Remote Clicker & Keyboard Spacebar Trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
        e.preventDefault();
        if (phase === 'SETUP' || phase === 'REVIEW') {
          handleStartShooting();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, timerSec, selectedFilter, isMirror, cameraActive]);

  // Hardware Camera Physical Shutter & Flash Trigger
  const triggerHardwareShutter = () => {
    if (!flashTriggerEnabled) return;
    try {
      // Gửi tín hiệu kích chụp tới digiCamControl / Local Camera Bridge HTTP
      fetch('http://127.0.0.1:5513/?CMD=Capture', { mode: 'no-cors' }).catch(() => {});
      // Gửi tín hiệu kích chụp tới Backend Bridge
      api.triggerCameraHardware().catch(() => {});
    } catch (e) {}
  };

  // 2. Capture Flow (8 Sequential Shots)
  const handleStartShooting = async () => {
    setPhase('SHOOTING');
    setShots([]);
    const captured = [];

    for (let shotIdx = 1; shotIdx <= 8; shotIdx++) {
      setCurrentShotIndex(shotIdx);

      // Countdown
      for (let s = timerSec; s >= 1; s--) {
        setCountdown(s);
        await sleep(1000);
      }
      setCountdown(null);

      // Flash & Trigger Hardware Shutter / Strobe Flash
      setFlashing(true);
      triggerHardwareShutter();
      setTimeout(() => setFlashing(false), 200);

      // Capture frame
      const dataUrl = captureFrameFromVideo();
      captured.push(dataUrl);
      setShots([...captured]);

      if (shotIdx < 8) {
        await sleep(800);
      }
    }

    setPhase('REVIEW');
  };

  const captureFrameFromVideo = () => {
    const canvas = document.createElement('canvas');
    const w = 1200;
    const h = 900;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Apply color grading filter directly to canvas rendering
    const filterCSS = getFilterCSS(selectedFilter);
    if (filterCSS && filterCSS !== 'none') {
      ctx.filter = filterCSS;
    }

    if (isMirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    if (cameraActive && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, w, h);
    } else if (demoCanvasRef.current) {
      ctx.drawImage(demoCanvasRef.current, 0, 0, w, h);
    }

    ctx.filter = 'none';
    return canvas.toDataURL('image/png');
  };

  // Single Retake
  const handleRetakeSingle = async (idx) => {
    setPhase('SHOOTING');
    setCurrentShotIndex(idx + 1);

    for (let s = timerSec; s >= 1; s--) {
      setCountdown(s);
      await sleep(1000);
    }
    setCountdown(null);

    setFlashing(true);
    triggerHardwareShutter();
    setTimeout(() => setFlashing(false), 200);

    const newShot = captureFrameFromVideo();
    const updated = [...shots];
    updated[idx] = newShot;
    setShots(updated);

    setPhase('REVIEW');
  };

  // 3. Render Live Preview & Develop
  const renderLivePreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || shots.length === 0) return;

    const isDarkFrame = !['#f6f5f0', '#fce7f3'].includes(frameColor);
    const subTextColor = isDarkFrame ? 'rgba(255,255,255,0.6)' : 'rgba(24,24,27,0.6)';
    const accentColor = isDarkFrame ? '#f59e0b' : '#b45309';

    // Set canvas dimensions based on layout
    let w = 800, h = 2400;
    if (layout === 'grid-4') {
      w = 1600; h = 1600;
    } else if (layout === 'strip-3') {
      w = 800; h = 2000;
    } else if (layout === 'strip-2') {
      w = 800; h = 1500;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 1. Fill Background Color
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, w, h);

    // 2. Determine title according to selectedTemplate
    const currentTpl = templates.find(t => t.id === selectedTemplate) || { name: 'Zump.pi Noir Signature' };
    const titleText = currentTpl.id === 'tpl_birthday' ? '🎂 HAPPY BIRTHDAY • PARTY'
      : currentTpl.id === 'tpl_y2k' ? '✨ Y2K CYBER ANGEL'
      : currentTpl.id === 'tpl_sweet' ? '💐 SWEET BOTANICAL'
      : 'ZUMP.PI STUDIO • 35MM ARCHIVE';

    // 3. Render Header with robust Vietnamese font stack
    ctx.fillStyle = accentColor;
    ctx.font = '700 24px "Be Vietnam Pro", "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
    ctx.fillText(titleText, 60, 80);

    // 4. Render Shots based on layout
    if (layout === 'grid-4') {
      const activeShots = shots.slice(0, 4);
      const size = 680;
      const positions = [
        { x: 80, y: 120 },
        { x: 840, y: 120 },
        { x: 80, y: 840 },
        { x: 840, y: 840 }
      ];

      for (let i = 0; i < Math.min(activeShots.length, 4); i++) {
        const shotUrl = activeShots[i];
        if (!shotUrl) continue;
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = shotUrl; });
        ctx.drawImage(img, positions[i].x, positions[i].y, size, size);
        ctx.strokeStyle = isDarkFrame ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(positions[i].x, positions[i].y, size, size);
      }

      ctx.fillStyle = subTextColor;
      ctx.font = '600 20px "Be Vietnam Pro", "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
      ctx.fillText(`NGÀY: ${new Date().toISOString().slice(0, 10)} • 4K 300 DPI`, 80, 1550);
    } else {
      const slotCount = layout === 'strip-2' ? 2 : (layout === 'strip-3' ? 3 : 4);
      const activeShots = shots.slice(0, slotCount);
      let topY = 120;
      const itemW = 680;
      const itemH = layout === 'strip-2' ? 600 : (layout === 'strip-3' ? 540 : 500);
      const gapY = layout === 'strip-2' ? 40 : 28;

      for (const shotUrl of activeShots) {
        if (!shotUrl) continue;
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = shotUrl; });
        ctx.drawImage(img, 60, topY, itemW, itemH);

        ctx.strokeStyle = isDarkFrame ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, topY, itemW, itemH);

        topY += itemH + gapY;
      }

      ctx.fillStyle = subTextColor;
      ctx.font = '600 20px "Be Vietnam Pro", "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
      ctx.fillText(`NGÀY: ${new Date().toISOString().slice(0, 10)} • 35MM FILM`, 60, h - 60);
    }
  };

  useEffect(() => {
    if (phase === 'REVIEW') {
      renderLivePreview();
    }
  }, [phase, shots, layout, frameColor, selectedTemplate]);

  // 3. Confirm Print & Develop Final PNG
  const handleDevelopFilm = async () => {
    setPhase('DEVELOPING');
    await sleep(600);

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const finalPng = canvas.toDataURL('image/png');
    setResultPng(finalPng);

    // Archive to Backend API
    let downloadUrl = `${window.location.origin}/download`;
    try {
      const sessionRes = await api.startSession();
      const sessId = sessionRes?.data?.sessionId || sessionRes?.sessionId;
      
      const archiveRes = await api.archivePhoto({
        sessionId: sessId,
        dataUrl: finalPng,
        filename: `zumppi_strip_${Date.now()}.png`,
        caption: 'Zump.pi Production Photobooth'
      });

      const fileId = archiveRes?.data?.fileId || archiveRes?.photo?.fileId || archiveRes?.fileId;
      if (sessId && fileId) {
        downloadUrl = `${window.location.origin}/download?sessionId=${encodeURIComponent(sessId)}&fileId=${encodeURIComponent(fileId)}`;
      }
    } catch (e) {
      console.warn('Archive photo failed, using fallback download URL:', e);
    }

    setQrUrl(downloadUrl);

    // Generate local offline-ready high quality QR Code Data URL
    try {
      const qrData = await QRCode.toDataURL(downloadUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrDataUrl(qrData);
    } catch (qrErr) {
      console.warn('QR Code generation error:', qrErr);
    }

    setPhase('RESULT');
  };

  // Photo & Thermal Printing (Epson L805 / DNP / Canon)
  const handlePrint = () => {
    setShowPrintModal(false);
    if (!printStageRef.current || !resultPng) return;

    printStageRef.current.innerHTML = printFormat === 'dual-2x6'
      ? `<div style="display:flex;width:100mm;height:150mm;position:relative;background:#ffffff;overflow:hidden;">
           <div style="width:50mm;height:150mm;overflow:hidden;display:flex;justify-content:center;align-items:center;">
             <img src="${resultPng}" style="width:50mm;height:150mm;object-fit:contain;display:block;"/>
           </div>
           <div style="width:50mm;height:150mm;overflow:hidden;display:flex;justify-content:center;align-items:center;">
             <img src="${resultPng}" style="width:50mm;height:150mm;object-fit:contain;display:block;"/>
           </div>
           <div class="cutting-guide-line"></div>
         </div>`
      : `<div style="width:100mm;height:150mm;background:#ffffff;display:flex;justify-content:center;align-items:center;overflow:hidden;">
           <img src="${resultPng}" style="width:100mm;height:150mm;object-fit:contain;display:block;"/>
         </div>`;

    setTimeout(() => {
      window.print();
    }, 150);
  };


  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Screen Flash */}
      {flashing && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, pointerEvents: 'none' }} />
      )}

      {/* Header */}
      <header className="z-header">
        <Link href="/" className="z-brand">
          <span style={{ color: 'var(--accent-gold)' }}>ZUMP.PI</span>
          <span>STUDIO</span>
          <span className="z-badge">KIOSK LIVE</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Camera Selector */}
          <select 
            className="btn-ghost" 
            style={{ fontSize: '0.78rem', padding: '6px 12px', maxWidth: '200px' }}
            value={selectedDeviceId}
            onChange={(e) => startCamera(e.target.value)}
          >
            {videoDevices.map((dev, idx) => (
              <option key={dev.deviceId || idx} value={dev.deviceId}>
                📷 {dev.label || `Camera ${idx + 1}`}
              </option>
            ))}
            {videoDevices.length === 0 && <option value="">✨ Demo Studio Live</option>}
          </select>

          {/* Flash Strobe / Trigger Toggle */}
          <button
            onClick={() => setFlashTriggerEnabled(!flashTriggerEnabled)}
            className="btn-ghost"
            style={{
              fontSize: '0.78rem',
              padding: '6px 12px',
              color: flashTriggerEnabled ? 'var(--accent-gold)' : 'var(--text-secondary)',
              borderColor: flashTriggerEnabled ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
            }}
            title="Kích hoạt màn trập cơ học Sony A74 & Cục phát sóng Flash Trigger Studio"
          >
            ⚡ Flash Trigger: {flashTriggerEnabled ? 'BẬT' : 'TẮT'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        padding: '20px 20px 90px 20px',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 0.8fr)',
        gap: '24px',
        flex: 1
      }}>
        {/* Left Column: Viewfinder & Stage */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          {phase === 'REVIEW' ? (
            <div style={{
              position: 'relative',
              width: '100%',
              minHeight: '620px',
              background: '#09090b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 20px',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--accent-gold)'
              }}>
                <span>🎞️ BẢN XEM TRƯỚC IN THẬT (REALTIME PREVIEW)</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 600 }}>
                  {LAYOUT_OPTIONS.find(l => l.id === layout)?.label} • {FRAME_COLORS.find(c => c.hex === frameColor)?.label}
                </span>
              </div>
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxHeight: '70vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginTop: '28px'
                }}
              />
            </div>
          ) : (
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              background: '#0a0a0a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isMirror ? 'scaleX(-1)' : 'none',
                  filter: getFilterCSS(selectedFilter),
                  display: cameraActive ? 'block' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />
              <canvas 
                ref={demoCanvasRef} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: getFilterCSS(selectedFilter),
                  display: !cameraActive ? 'block' : 'none',
                  transition: 'filter 0.3s ease'
                }}
              />


              {/* Countdown Overlay */}
              {countdown !== null && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10, 10, 10, 0.65)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 40
                }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '6.5rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    textShadow: '0 0 40px rgba(245, 158, 11, 0.6)'
                  }}>
                    {countdown}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--accent-gold)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginTop: '10px'
                  }}>
                    TẤM {currentShotIndex} / 8
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8-Shot Film Rail */}
          <div style={{
            padding: '14px 16px',
            background: '#0e0e11',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>CUỘN PHIM 35MM</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{shots.length}/8 TẤM</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} style={{
                  aspectRatio: '4 / 3',
                  background: '#18181b',
                  border: `1px solid ${shots[idx] ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--text-dim)'
                }}>
                  {shots[idx] ? (
                    <img src={shots[idx]} alt={`Shot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    `#0${idx + 1}`
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Stage Panels */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>

          {/* Phase: SETUP */}
          {phase === 'SETUP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: '#18181b',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold)',
                  letterSpacing: '0.04em'
                }}>
                  ✦ BUỒNG CHỤP TỰ ĐỘNG • CUỘN 8 TẤM
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  Hệ thống tự động chụp liên hoàn 8 kiểu. Sau khi chụp xong, bạn sẽ được <strong>tự do chọn khung hình, đổi màu sắc và xem trước bản in</strong>!
                </div>
              </div>

              {/* 1. Filter Pills */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  <span>1. CHỌN BỘ LỌC MÀU PHIM</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{filters.length} MÀU</span>
                </label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {filters.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      style={{
                        background: selectedFilter === f.id ? '#ffffff' : '#18181b',
                        color: selectedFilter === f.id ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${selectedFilter === f.id ? '#ffffff' : 'var(--border-subtle)'}`,
                        padding: '9px 16px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: selectedFilter === f.id ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Timer Options */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  2. HẸN GIỜ ĐẾM NGƯỢC
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {[3, 5, 10].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setTimerSec(sec)}
                      style={{
                        flex: 1,
                        background: timerSec === sec ? '#ffffff' : '#18181b',
                        color: timerSec === sec ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${timerSec === sec ? '#ffffff' : 'var(--border-subtle)'}`,
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ {sec} giây
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartShooting}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '0.9rem', marginTop: '10px' }}
              >
                📸 BẮT ĐẦU CHỤP (8 TẤM)
              </button>
            </div>
          )}

          {/* Phase: REVIEW (Choose Frames, Layouts & Colors with Live Preview) */}
          {phase === 'REVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold)'
                }}>
                  HOÀN THÀNH 8 KIỂU CHỤP
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  Chọn Khung & Bố Cục Bản In
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Bản xem trước ở cột trái sẽ cập nhật ngay khi bạn bấm chọn.
                </p>
              </div>

              {/* 1. 8-Shot Thumbnails & Retake */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  <span>1. ẢNH ĐÃ CHỤP (CHẠM ĐỂ CHỤP LẠI RIÊNG TẤM ĐÓ)</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {shots.map((shot, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleRetakeSingle(idx)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4 / 3',
                        background: '#18181b',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      title="Bấm để chụp lại tấm này"
                    >
                      <img src={shot} alt={`Shot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-gold)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                      >
                        🔄 Chụp lại #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Layout Selection */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  <span>2. BỐ CỤC KHUNG HÌNH</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{LAYOUT_OPTIONS.find(l => l.id === layout)?.label}</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {LAYOUT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLayout(opt.id)}
                      style={{
                        background: layout === opt.id ? '#ffffff' : '#18181b',
                        color: layout === opt.id ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${layout === opt.id ? '#ffffff' : 'var(--border-subtle)'}`,
                        padding: '10px 12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Frame Color */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  <span>3. MÀU NỀN KHUNG</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{FRAME_COLORS.find(c => c.hex === frameColor)?.label}</span>
                </label>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {FRAME_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setFrameColor(color.hex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: frameColor === color.hex ? 'rgba(255,255,255,0.1)' : '#18181b',
                        border: `1.5px solid ${frameColor === color.hex ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                        padding: '7px 14px',
                        borderRadius: '9999px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: frameColor === color.hex ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: color.hex,
                        border: `1px solid ${color.border}`,
                        display: 'inline-block'
                      }} />
                      <span>{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Template Selection */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  <span>4. MẪU KHUNG TEMPLATE</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{templates.find(t => t.id === selectedTemplate)?.name}</span>
                </label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      style={{
                        background: selectedTemplate === tpl.id ? 'var(--accent-gold)' : '#18181b',
                        color: selectedTemplate === tpl.id ? '#000000' : 'var(--text-secondary)',
                        border: `1px solid ${selectedTemplate === tpl.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.76rem',
                        fontWeight: selectedTemplate === tpl.id ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setPhase('SETUP')} className="btn-ghost" style={{ flex: 1, padding: '14px' }}>
                  ‹ Chụp lại từ đầu
                </button>
                <button onClick={handleDevelopFilm} className="btn-primary" style={{ flex: 1.6, padding: '14px', fontSize: '0.88rem' }}>
                  🖨️ XÁC NHẬN IN & TẠO QR →
                </button>
              </div>
            </div>
          )}

          {/* Phase: DEVELOPING */}
          {phase === 'DEVELOPING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(245, 158, 11, 0.2)',
                borderTopColor: 'var(--accent-gold)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '20px'
              }} />
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                Đang Tráng Phim 35mm Chemical Bath...
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                RENDERING 300 DPI • TẠO MÃ QR TẢI VỀ
              </div>
            </div>
          )}

          {/* Phase: RESULT */}
          {phase === 'RESULT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                letterSpacing: '0.08em'
              }}>
                ★ 35MM ARCHIVE COMPLETED ★
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Thành Phẩm Buồng Chụp</h2>

              {/* QR Mobile Download Card */}
              <div style={{
                background: '#18181b',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px 16px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px', color: '#fff' }}>
                  📱 Quét Mã Tải Về Điện Thoại
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Mở camera điện thoại quét để lưu ảnh gốc 300 DPI
                </div>
                {(qrDataUrl || qrUrl) ? (
                  <div style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
                  }}>
                    <img 
                      src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
                      alt="QR Code Tải Ảnh" 
                      style={{ width: '160px', height: '160px', display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Đang khởi tạo mã QR tải ảnh...
                  </div>
                )}
                {qrUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <a 
                      href={qrUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--accent-gold)', 
                        textDecoration: 'underline',
                        wordBreak: 'break-all'
                      }}
                    >
                      Nhấn vào đây để mở trực tiếp trang tải ảnh →
                    </a>
                  </div>
                )}
              </div>

              <button onClick={() => setShowPrintModal(true)} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                🖨️ IN ẢNH LẤY LIỀN (MÁY IN NHIỆT)
              </button>

              <button onClick={() => setPhase('SETUP')} className="btn-ghost" style={{ width: '100%' }}>
                📸 Chụp Cuộn Phim Mới
              </button>
            </div>
          )}
        </div>
      </main>

      {/* STICKY BOTTOM SHUTTER BAR (ALWAYS VISIBLE DURING SETUP) */}
      {phase === 'SETUP' && (
        <div className="sticky-capture-bar">
          <button 
            onClick={() => setIsMirror(!isMirror)}
            className="btn-ghost" 
            style={{ borderRadius: '9999px', padding: '10px 14px', fontSize: '0.78rem' }}
          >
            🪞 {isMirror ? 'Lật Gương: BẬT' : 'Lật Gương: TẮT'}
          </button>

          <button 
            onClick={handleStartShooting} 
            className="shutter-btn-main"
            title="Bấm nút trên màn hình hoặc nhấn phím Space / Remote cầm tay để chụp"
          >
            <span className="rec-blinker"></span>
            <span>BẮT ĐẦU CHỤP (SPACE / REMOTE)</span>
          </button>

          <button 
            onClick={() => setTimerSec(timerSec === 3 ? 5 : timerSec === 5 ? 10 : 3)}
            className="btn-ghost" 
            style={{ borderRadius: '9999px', padding: '10px 14px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
          >
            ⏱️ {timerSec}s
          </button>
        </div>
      )}

      {/* Thermal Print Modal */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '460px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>
              🖨️ Chọn Khổ In Ảnh (Epson L805 / DNP / Canon)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#0a0a0a',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="format" 
                  value="dual-2x6" 
                  checked={printFormat === 'dual-2x6'} 
                  onChange={() => setPrintFormat('dual-2x6')}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Khổ Đôi 2 Dải 2x6 inch (Cắt đôi)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    In trên 1 tờ giấy 10x15cm (4x6"), tự động có vạch chỉ cắt đôi ở giữa.
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#0a0a0a',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="format" 
                  value="4x6" 
                  checked={printFormat === '4x6'} 
                  onChange={() => setPrintFormat('4x6')}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Khổ Bưu Thiếp 4x6 inch (10x15 cm)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    In tràn lề trọn vẹn 1 tấm ảnh bưu thiếp chất lượng 300 DPI.
                  </div>
                </div>
              </label>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.75rem',
              color: 'var(--accent-gold)',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}>
              💡 <strong>Mẹo in Epson L805 nét nhất:</strong> Chọn loại giấy <em>Epson Premium Glossy</em>, chất lượng <em>High</em>, bật <em>Borderless</em> (In tràn lề) và tích chọn <em>Background graphics</em> trong hộp thoại in.
            </div>


            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handlePrint} className="btn-primary" style={{ flex: 1 }}>
                XÁC NHẬN IN
              </button>
              <button onClick={() => setShowPrintModal(false)} className="btn-ghost">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Canvas & Stages */}
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
      <div id="printKioskStage" ref={printStageRef} style={{ display: 'none' }} />
    </div>
  );
}
