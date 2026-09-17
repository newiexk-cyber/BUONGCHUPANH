'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../services/api';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState({ checking: true, online: false, data: null });
  const [testLog, setTestLog] = useState([]);

  const addLog = (msg) => {
    setTestLog(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 7)
    ]);
  };

  // Check Backend Health on Mount
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      try {
        const res = await api.checkHealth();
        if (isMounted) {
          setApiStatus({ checking: false, online: true, data: res });
          addLog(`Backend 3 Tầng kết nối thành công (Port 5000) • Uptime: ${Math.round(res.uptime || 0)}s`);
        }
      } catch (err) {
        if (isMounted) {
          setApiStatus({ checking: false, online: false, data: null });
          addLog(`Backend 3 Tầng chưa kết nối (Khởi động bằng 'docker compose up' hoặc 'cd backend && npm start')`);
        }
      }
    }
    checkBackend();
    return () => { isMounted = false; };
  }, []);

  const handlePingTest = async () => {
    addLog('Đang gửi ping kiểm tra kết nối API 3 Tầng...');
    try {
      const res = await api.checkHealth();
      setApiStatus({ checking: false, online: true, data: res });
      addLog(`✅ API Online! Status: ${res.status} | Time: ${res.timestamp || new Date().toISOString()}`);
    } catch (err) {
      setApiStatus({ checking: false, online: false, data: null });
      addLog(`❌ Không thể kết nối API: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#f5f5f7' }}>
      {/* Top Telemetry & Status Bar */}
      <div style={{
        background: '#111114',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>ZUMP.PI KIOSK PLATFORM</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: apiStatus.online ? '#10b981' : (apiStatus.checking ? '#f59e0b' : '#ef4444'),
              boxShadow: apiStatus.online ? '0 0 8px #10b981' : 'none'
            }}></span>
            {apiStatus.checking
              ? 'Đang kiểm tra kết nối Backend...'
              : (apiStatus.online ? 'Backend 3-Tier: ONLINE (Port 5000)' : 'Backend 3-Tier: OFFLINE')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handlePingTest}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--accent-gold)',
              padding: '3px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            ⚡ Test Ping API
          </button>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Docker & Nginx Ready</span>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="z-header">
        <Link href="/" className="z-brand">
          <span style={{ color: 'var(--accent-gold)' }}>ZUMP.PI</span>
          <span>STUDIO</span>
          <span className="z-badge">ENTERPRISE 3-TIER</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="btn-ghost" style={{ fontSize: '0.78rem' }}>
            ⚙️ Quản Trị Admin
          </Link>
          <Link href="/studio" className="btn-primary" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
            📸 Vào Buồng Chụp (Kiosk)
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '6px 14px',
          borderRadius: '9999px',
          color: 'var(--accent-gold)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: '700',
          letterSpacing: '0.08em',
          marginBottom: '20px'
        }}>
          <span>✦</span>
          <span>ENTERPRISE ARCHITECTURE: NEXT.JS 14 & EXPRESS 3-TIER</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-editorial)',
          fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          maxWidth: '850px',
          marginBottom: '18px'
        }}>
          Buồng Chụp Ảnh Kiosk <span style={{ color: 'var(--accent-gold)' }}>Zump.pi Production</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          Giao diện Dark Minimalist chuẩn Zump.pi Production. Phân tách hoàn toàn Frontend & Backend, tích hợp nút chụp Sticky Shutter Bar, bộ chuyển đổi camera, xuất ảnh 300 DPI và quét QR nhận ảnh.
        </p>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
          <Link href="/studio" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            <span className="rec-blinker"></span>
            📸 BẮT ĐẦU CHỤP (KIOSK STUDIO)
          </Link>
          <Link href="/admin" className="btn-ghost" style={{ padding: '16px 28px', fontSize: '1rem' }}>
            ⚙️ BẢNG QUẢN TRỊ ADMIN
          </Link>
          <Link
            href="/download?sessionId=demo-session-2026&fileId=sample-strip"
            className="btn-ghost"
            style={{ padding: '16px 24px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}
          >
            📱 Test Trang QR Mobile
          </Link>
        </div>

        {/* Live Test Diagnostic Console */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '48px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontWeight: 700 }}>
              TERMINAL KIỂM THỬ HỆ THỐNG (SYSTEM TEST CONSOLE)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePingTest}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Ping Health
              </button>
              <button
                onClick={() => setTestLog([])}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Xóa Log
              </button>
            </div>
          </div>

          <div style={{
            background: '#070709',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem',
            minHeight: '80px',
            color: '#10b981',
            lineHeight: 1.6
          }}>
            {testLog.length === 0 ? (
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>Chưa có log tương tác. Bấm "Ping Health" để thử nghiệm kết nối.</span>
            ) : (
              testLog.map((log, index) => (
                <div key={index} style={{ color: log.includes('❌') ? '#f87171' : (log.includes('✅') ? '#34d399' : '#e2e8f0') }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          width: '100%',
          maxWidth: '1080px',
          textAlign: 'left'
        }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Nút Chụp Sticky Cố Định</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Nút chụp luôn hiển thị ở mép dưới viewport, không cần cuộn trang trên màn hình cảm ứng hoặc thiết bị di động.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🔄</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Đổi Camera & Virtual Studio</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Chuyển đổi tức thì giữa các thiết bị webcam/máy ảnh và chế độ Studio Ảo chạy thử khi không có webcam thật.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>⚙️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Bảng Quản Trị Admin Mới</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Theo dõi dung lượng ổ cứng thời gian thực, quản trị khung mẫu Canva, cấu hình bộ lọc và dọn dẹp bộ nhớ.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🐳</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Docker & Nginx Chuẩn Hóa</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Khởi chạy toàn bộ hệ sinh thái chỉ bằng 1 lệnh <code>docker compose up -d</code> với cấu hình Nginx Reverse Proxy.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        © 2026 Zump.pi Production Studio Photobooth Engine. All rights reserved.
      </footer>
    </div>
  );
}
