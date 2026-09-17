'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="z-header">
        <Link href="/" className="z-brand">
          <span style={{ color: 'var(--accent-gold)' }}>ZUMP.PI</span>
          <span>STUDIO</span>
          <span className="z-badge">35MM KIOSK</span>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="btn-ghost" style={{ fontSize: '0.78rem' }}>
            ⚙️ Quản Trị Admin
          </Link>
          <Link href="/studio" className="btn-primary" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
            📸 Vào Buồng Chụp
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
          <span>VISUAL PRODUCTION & COMMERCIAL KIOSK ENGINE</span>
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
          Buồng Chụp Ảnh Kiosk <span style={{ color: 'var(--accent-gold)' }}>35mm Analog</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          lineHeight: 1.6,
          marginBottom: '36px'
        }}>
          Hệ thống chụp ảnh tự động phong cách Photoism & Zump.pi Production. Tráng phim 300 DPI, tạo GIF timelapse, quét mã QR tải về điện thoại và in nhiệt lấy liền.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px' }}>
          <Link href="/studio" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            <span className="rec-blinker"></span>
            BẮT ĐẦU CHỤP ẢNH (KIOSK)
          </Link>
          <Link href="/admin" className="btn-ghost" style={{ padding: '16px 28px', fontSize: '1rem' }}>
            Quản Lý Filters & Canva
          </Link>
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
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🎞️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>50+ Bộ Lọc Phim 35mm</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Kodak Gold 200, CineStill 800T, Fuji Pro 400H và các tone màu làm đẹp chân dung Hàn Quốc.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>📱</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Mã QR Tải Về Mobile</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Khách dùng điện thoại quét mã QR tại buồng để lưu file 300 DPI và GIF HD chỉ với 1 chạm.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🖨️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>In Nhiệt 2x6" & 4x6"</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Căn chuẩn in ấn tự động không viền, hỗ trợ các dòng máy in DNP DS-RX1HS, Citizen, Canon Selphy.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🛡️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>Bảo Mật Enterprise 3 Tầng</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              Kiểm tra nhị phân Magic Bytes, cô lập phiên chụp, ẩn token Canva và tự động dọn dẹp sau 24h.
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
