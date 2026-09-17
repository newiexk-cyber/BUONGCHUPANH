'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '../../services/api';

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

  // Filters & Layouts
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('goc');
  const [layout, setLayout] = useState('strip-4');

  // Shooting & Frames Data
  const [shots, setShots] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [flashing, setFlashing] = useState(false);

  // Result & Export
  const [resultPng, setResultPng] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState('dual-2x6');

  // DOM Refs
  const videoRef = useRef(null);
  const demoCanvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const printStageRef = useRef(null);

  // 1. Initialize Filters & Cameras on Mount
  useEffect(() => {
    loadFilters();
    initCameraList();
    startDemoAnimation();

    return () => {
      stopCameraStream();
    };
  }, []);

  const loadFilters = async () => {
    try {
      const data = await api.getFilters();
      if (data && data.data) {
        setFilters(data.data.filter(f => f.isActive));
      }
    } catch (e) {
      // Fallback default filters
      setFilters([
        { id: 'goc', name: 'Gốc (Raw)' },
        { id: 'kodak200', name: '🎞️ Kodak Gold 200' },
        { id: 'fuji400', name: '🌿 Fuji Pro 400H' },
        { id: 'cinestill', name: '🎬 CineStill 800T' },
        { id: 'portra400', name: '🌸 Portra 400' },
        { id: 'ilford', name: '🖤 Ilford B&W' },
        { id: 'minda', name: '✨ Mịn Da Hàn Quốc' }
      ]);
    }
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

      // Flash
      setFlashing(true);
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

    if (isMirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    if (cameraActive && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, w, h);
    } else if (demoCanvasRef.current) {
      ctx.drawImage(demoCanvasRef.current, 0, 0, w, h);
    }

    // Apply color grading filter
    applyFilterToCanvas(ctx, selectedFilter, w, h);

    return canvas.toDataURL('image/png');
  };

  const applyFilterToCanvas = (ctx, filter, w, h) => {
    if (filter === 'goc') return;
    if (filter === 'kodak200') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(0, 0, w, h);
    } else if (filter === 'ilford') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = v; d[i + 1] = v; d[i + 2] = v;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filter === 'minda') {
      ctx.fillStyle = 'rgba(255, 230, 240, 0.08)';
      ctx.fillRect(0, 0, w, h);
    }
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
    setTimeout(() => setFlashing(false), 200);

    const newShot = captureFrameFromVideo();
    const updated = [...shots];
    updated[idx] = newShot;
    setShots(updated);

    setPhase('REVIEW');
  };

  // 3. Develop & Render 300 DPI Film Strip
  const handleDevelopFilm = async () => {
    setPhase('DEVELOPING');
    await sleep(1200);

    // Render 300 DPI strip
    const canvas = exportCanvasRef.current || document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 2400);

    // Frame header
    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText('ZUMP.PI STUDIO • 35MM ARCHIVE', 60, 80);

    // Draw 4 chosen shots
    const activeShots = shots.slice(0, 4);
    let topY = 120;
    const itemW = 680;
    const itemH = 500;

    for (const shotUrl of activeShots) {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = shotUrl; });
      ctx.drawImage(img, 60, topY, itemW, itemH);
      topY += itemH + 28;
    }

    // Date stamp
    ctx.fillStyle = '#71717a';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(`DATE: ${new Date().toISOString().slice(0, 10)}`, 60, 2320);

    const finalPng = canvas.toDataURL('image/png');
    setResultPng(finalPng);

    // Archive to Backend API
    try {
      const sessionRes = await api.startSession();
      const sessId = sessionRes.sessionId;
      const archiveRes = await api.archivePhoto({
        sessionId: sessId,
        dataUrl: finalPng,
        filename: `zumppi_strip_${Date.now()}.png`,
        caption: 'Zump.pi Production Photobooth'
      });

      if (archiveRes && archiveRes.photo) {
        const downloadUrl = `${window.location.origin}/download?sessionId=${sessId}&fileId=${archiveRes.photo.fileId}`;
        setQrUrl(downloadUrl);
      }
    } catch (e) {
      setQrUrl(`${window.location.origin}/download`);
    }

    setPhase('RESULT');
  };

  // Thermal Printing
  const handlePrint = () => {
    setShowPrintModal(false);
    if (!printStageRef.current || !resultPng) return;

    printStageRef.current.innerHTML = printFormat === 'dual-2x6'
      ? `<div style="display:flex;width:100mm;height:150mm;">
           <img src="${resultPng}" style="width:50mm;height:150mm;object-fit:contain;"/>
           <img src="${resultPng}" style="width:50mm;height:150mm;object-fit:contain;"/>
         </div>`
      : `<img src="${resultPng}" style="width:100mm;height:150mm;object-fit:contain;"/>`;

    window.print();
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

          <Link href="/admin" className="btn-ghost" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
            ⚙️ Admin
          </Link>
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
                display: cameraActive ? 'block' : 'none'
              }}
            />
            <canvas 
              ref={demoCanvasRef} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: !cameraActive ? 'block' : 'none'
              }}
            />

            {/* Viewfinder Telemetry */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '16px',
              right: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              zIndex: 20
            }}>
              <span>RAW • 35MM</span>
              <span>ISO 400 • F/2.8 • 1/125S</span>
              <span>4K • 300 DPI</span>
            </div>

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
                  fontFamily: 'var(--font-editorial)',
                  fontSize: '6.5rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  textShadow: '0 0 40px rgba(245, 158, 11, 0.6)'
                }}>
                  {countdown}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                background: '#18181b',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '14px 16px'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  ✦ STUDIO KIOSK • 8-SHOT ARCHIVAL ROLL
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  Hệ thống tự động chụp liên hoàn 8 tấm. Chụp xong bạn có thể xem lại, chụp lại từng ô và xuất ảnh 300 DPI!
                </div>
              </div>

              {/* Filter Pills */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  <span>1. BỘ LỌC MÀU PHIM</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{filters.length} FILTERS</span>
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
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
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

              {/* Timer Options */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  2. HẸN GIỜ ĐẾM NGƯỢC
                </label>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {[3, 5, 10].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setTimerSec(sec)}
                      style={{
                        flex: 1,
                        background: timerSec === sec ? '#ffffff' : '#18181b',
                        color: timerSec === sec ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${timerSec === sec ? '#ffffff' : 'var(--border-subtle)'}`,
                        padding: '10px',
                        borderRadius: '12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ {sec} giây
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Phase: REVIEW (8 Shots & Single Retake) */}
          {phase === 'REVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>Xem Lại 8 Tấm Vừa Chụp</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Chạm vào ô nào chưa ưng ý để chụp lại riêng tấm đó.
                </p>
              </div>

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
                    title="Bấm để chụp lại"
                  >
                    <img src={shot} alt={`Shot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.6)',
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
                      📸 Chụp lại #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setPhase('SETUP')} className="btn-ghost" style={{ flex: 1 }}>
                  ‹ Chụp lại từ đầu
                </button>
                <button onClick={handleDevelopFilm} className="btn-primary" style={{ flex: 1.4 }}>
                  TRÁNG PHIM & XUẤT ẢNH →
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
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
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
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '4px' }}>
                  📱 Quét Mã Tải Về Điện Thoại
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Mở camera điện thoại quét để lưu ảnh gốc 300 DPI
                </div>
                {qrUrl && (
                  <div style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '10px'
                  }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                      alt="QR Code" 
                      style={{ width: '140px', height: '140px', display: 'block' }}
                    />
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

          <button onClick={handleStartShooting} className="shutter-btn-main">
            <span className="rec-blinker"></span>
            <span>BẮT ĐẦU CHỤP (8 TẤM)</span>
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
              🖨️ Chọn Khổ In Máy In Nhiệt
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chuẩn máy in DNP/Canon 4x6" chia 2 dải film 5x15cm.</div>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In trọn vẹn 1 tấm bưu thiếp ảnh lớn 300 DPI.</div>
                </div>
              </label>
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
