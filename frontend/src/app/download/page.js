'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';

export default function DownloadPage() {
  const [fileId, setFileId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

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
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ZUMPPI_STUDIO_${sessionId.slice(0, 8)}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Không thể tải ảnh. Vui lòng thử lại hoặc chụp lại mã QR.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-between p-6 font-sans">
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="font-bold text-xs tracking-widest uppercase font-mono">ZUMP.PI STUDIO</span>
        </div>
        <span className="text-[10px] font-mono text-white/40">DIGITAL DELIVERY</span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md my-auto flex flex-col items-center">
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500">
            Kỷ Niệm Của Bạn Đã Sẵn Sàng
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">Tải Ảnh Kiosk Studio</h1>
          <p className="text-xs text-white/50 mt-1 font-mono">
            Độ phân giải cao 300 DPI • Lưu trữ bảo mật 24 giờ
          </p>
        </div>

        {/* Photo Viewfinder */}
        <div className="w-full bg-[#121214] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {photoUrl ? (
            <div className="relative group w-full flex justify-center">
              <img
                src={photoUrl}
                alt="Zump.pi Photobooth Strip"
                className="max-h-[55vh] object-contain rounded-lg border border-white/10 shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  alert('Ảnh có thể đã hết hạn lưu trữ hoặc phiên chụp chưa kết thúc.');
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <span className="text-3xl mb-3 opacity-40">📷</span>
              <p className="text-xs text-white/60 font-mono">
                Không tìm thấy thông tin ảnh. Vui lòng quét mã QR trên màn hình Kiosk Studio.
              </p>
            </div>
          )}

          {/* Download Action Buttons */}
          {photoUrl && (
            <div className="w-full mt-6 space-y-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-xl shadow-amber-500/10 font-mono flex items-center justify-center gap-2"
              >
                <span>{downloading ? 'Đang Xử Lý Tải Về...' : '⬇ Tải Ảnh Gốc (300 DPI)'}</span>
              </button>

              <div className="text-center">
                <span className="text-[10px] text-white/30 font-mono">
                  Phiên chụp: {sessionId ? sessionId.slice(0, 16) : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md py-4 text-center border-t border-white/5">
        <p className="text-[10px] text-white/40 font-mono">
          ZUMP.PI PRODUCTION • TỰ HÀO MANG LẠI TRẢI NGHIỆM PHOTOBOOTH ĐẲNG CẤP
        </p>
        <Link href="/studio" className="text-[10px] text-amber-500/70 hover:text-amber-400 mt-1 inline-block">
          Chụp ảnh phiên mới tại Kiosk →
        </Link>
      </footer>
    </div>
  );
}
