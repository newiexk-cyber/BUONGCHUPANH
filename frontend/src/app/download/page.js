'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';

export default function DownloadPage() {
  const [fileId, setFileId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fid = params.get('fileId') || '';
      const sid = params.get('sessionId') || '';
      setFileId(fid);
      setSessionId(sid);

      if (fid && sid) {
        setPhotoUrl(api.getPhotoViewUrl(fid, sid));
      }
    }
  }, []);

  const handleDownload = async () => {
    if (!photoUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ZUMPPI_STUDIO_${sessionId ? sessionId.slice(0, 8) : 'PHOTO'}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: direct window download
      const a = document.createElement('a');
      a.href = photoUrl;
      a.target = '_blank';
      a.download = `ZUMPPI_PHOTO_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 16px',
      fontFamily: 'var(--font-sans, "Be Vietnam Pro", sans-serif)'
    }}>
      {/* Top Header */}
      <header style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-gold, #f59e0b)',
            boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
          }} />
          <span style={{
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            ZUMP.PI STUDIO
          </span>
        </div>
        <span style={{
          fontSize: '0.68rem',
          color: 'var(--accent-gold, #f59e0b)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontWeight: 700
        }}>
          300 DPI ORIGINAL
        </span>
      </header>

      {/* Main Body */}
      <main style={{
        width: '100%',
        maxWidth: '440px',
        margin: 'auto 0',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--accent-gold, #f59e0b)',
            textTransform: 'uppercase',
            marginBottom: '6px'
          }}>
            ★ KỶ NIỆM CỦA BẠN ĐÃ SẴN SÀNG ★
          </div>
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 6px 0'
          }}>
            Tải Ảnh Kiosk Studio
          </h1>
          <p style={{
            fontSize: '0.78rem',
            color: '#a1a1aa',
            margin: 0
          }}>
            Độ phân giải cao 300 DPI • Lưu trữ an toàn 24 giờ
          </p>
        </div>

        {/* Photo View Box */}
        <div style={{
          width: '100%',
          backgroundColor: '#141416',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          {photoUrl && !loadError ? (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img
                src={photoUrl}
                alt="Zump.pi Photobooth Strip"
                style={{
                  maxHeight: '52vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  display: 'block'
                }}
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '2.5rem' }}>📷</span>
              <p style={{ fontSize: '0.82rem', color: '#a1a1aa', maxWidth: '280px', lineHeight: 1.5, margin: 0 }}>
                {loadError 
                  ? 'Ảnh có thể đã hết hạn lưu trữ hoặc đang xử lý. Bạn có thể nhấn tải lại hoặc quét lại mã.'
                  : 'Vui lòng quét mã QR hiển thị trên màn hình buồng chụp Kiosk Studio để tải ảnh của bạn.'}
              </p>
            </div>
          )}

          {/* Action Button */}
          {photoUrl && (
            <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: 'var(--accent-gold, #f59e0b)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '0.04em',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                  transition: 'transform 0.15s ease, background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{downloading ? '⏳ ĐANG TẢI ẢNH VỀ MÁY...' : '⬇ TẢI ẢNH GỐC (300 DPI)'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono, monospace)' }}>
                  Mã phiên: {sessionId ? sessionId.slice(0, 16) : 'ZUMPPI'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%',
        maxWidth: '440px',
        paddingTop: '16px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0 0 6px 0' }}>
          ZUMP.PI PRODUCTION • PHOTOBOOTH KIOSK 2026
        </p>
        <Link 
          href="/studio" 
          style={{ 
            fontSize: '0.75rem', 
            color: 'var(--accent-gold, #f59e0b)', 
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Trở về Studio Chụp Ảnh →
        </Link>
      </footer>
    </div>
  );
}
