'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [overview, setOverview] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'templates' | 'filters'

  // New Template Form State
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    orientation: 'vertical',
    slots: 4,
    canvaDesignId: '',
    frameColor: '#0a0a0a'
  });
  const [actionNotice, setActionNotice] = useState(null);

  // Restore Key from SessionStorage
  useEffect(() => {
    const savedKey = sessionStorage.getItem('zumppi_admin_key');
    if (savedKey) {
      setAdminKey(savedKey);
      loadDashboardData(savedKey);
    }
  }, []);

  const notify = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    setLoading(true);
    setAuthError('');

    try {
      await loadDashboardData(adminKey.trim());
      sessionStorage.setItem('zumppi_admin_key', adminKey.trim());
      setIsAuthenticated(true);
    } catch (err) {
      setAuthError(err.message || 'Khóa bảo mật quản trị viên không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('zumppi_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setOverview(null);
  };

  const loadDashboardData = async (key) => {
    const [overviewData, templatesData, filtersData] = await Promise.all([
      api.adminGetOverview(key),
      api.adminGetTemplates(key),
      api.adminGetFilters(key)
    ]);

    setOverview(overviewData.data);
    setTemplates(templatesData.data || []);
    setFilters(filtersData.data || []);
    setIsAuthenticated(true);
  };

  const handleTriggerCleanup = async () => {
    if (!confirm('Xác nhận dọn dẹp các session ảnh đã hết hạn lưu trữ (24h)?')) return;
    setLoading(true);
    try {
      const res = await api.adminTriggerCleanup(adminKey);
      notify(res.message || 'Đã dọn dẹp dung lượng thành công');
      await loadDashboardData(adminKey);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.slots) {
      notify('Vui lòng nhập đầy đủ tên và số lượng khung ảnh', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.adminSaveTemplate(newTemplate, adminKey);
      notify('Tạo mẫu template thành công');
      setNewTemplate({
        name: '',
        orientation: 'vertical',
        slots: 4,
        canvaDesignId: '',
        frameColor: '#0a0a0a'
      });
      const res = await api.adminGetTemplates(adminKey);
      setTemplates(res.data || []);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa khung mẫu này?')) return;
    try {
      await api.adminDeleteTemplate(id, adminKey);
      notify('Đã xóa khung mẫu');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleToggleFilter = async (filterId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.adminToggleFilter(filterId, newStatus, adminKey);
      setFilters(prev => prev.map(f => f.id === filterId ? { ...f, isActive: newStatus } : f));
      notify(`Đã cập nhật trạng thái bộ lọc`);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // --- LOGIN GATEWAY ---
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#141416',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Accent Gold Top Stripe */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f59e0b, #ea580c, #f59e0b)'
          }} />

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--accent-gold)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '4px 12px',
              borderRadius: '9999px',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              ✦ ZUMP.PI KIOSK SYSTEM
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              Bảng Quản Trị Hệ Thống
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Xác thực quyền quản trị qua Secret Key bảo mật
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Admin Secret Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Nhập mã bảo mật quản trị viên..."
                style={{
                  width: '100%',
                  background: '#18181b',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            {authError && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.78rem',
                lineHeight: 1.4
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '0.88rem',
                marginTop: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang xác thực...' : 'TRUY CẬP QUẢN TRỊ →'}
            </button>

            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <Link 
                href="/studio" 
                style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-dim)', 
                  textDecoration: 'none',
                  transition: 'color 0.15s ease'
                }}
              >
                ← Quay lại Kiosk Studio
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD INTERFACE ---
  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-mono shadow-2xl backdrop-blur-md animate-fade-in ${
          actionNotice.type === 'error'
            ? 'bg-red-950/80 border-red-500/50 text-red-300'
            : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
        }`}>
          {actionNotice.msg}
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0e0e10]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/studio" className="text-xs font-mono text-white/40 hover:text-white transition">
              ← Studio
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-sm tracking-wide">ZUMP.PI ADMIN DASHBOARD</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                v2.0 Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerCleanup}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-amber-400 transition"
              title="Dọn dẹp session và ảnh tạm đã lưu quá 24h"
            >
              🧹 Dọn Dẹp Dung Lượng
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 transition"
            >
              Đăng Xuất
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex gap-6 border-t border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            HỆ THỐNG & DUNG LƯỢNG
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'templates'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            KHUNG MẪU TEMPLATE ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'filters'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            BỘ LỌC MÀU FILTER ({filters.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* TAB 1: OVERVIEW & STORAGE METRICS */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8 animate-fade-in">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Dung Lượng Ảnh Lưu Trữ</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
                  {overview.storage?.storageUsedMB || '0.00'} <span className="text-sm font-normal text-white/40">MB</span>
                </div>
                <div className="text-[11px] text-white/50 mt-2">
                  Giới hạn tự động: {overview.config?.retentionHours || 24} giờ
                </div>
              </div>

              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Tổng Session Đã Tạo</span>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overview.storage?.totalSessions || 0}
                </div>
                <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                  <span>●</span> Hoạt động bình thường
                </div>
              </div>

              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Tổng File Ảnh Trong Kiosk</span>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overview.storage?.totalPhotos || 0}
                </div>
                <div className="text-[11px] text-white/50 mt-2">
                  Định dạng: PNG 300 DPI High-Res
                </div>
              </div>

              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">RAM Sử Dụng (Node.js)</span>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {overview.system?.memoryUsedMB || '0'} <span className="text-sm font-normal text-white/40">MB</span>
                </div>
                <div className="text-[11px] text-white/50 mt-2">
                  Uptime: {Math.floor(overview.system?.uptimeSeconds / 60)} phút
                </div>
              </div>
            </div>

            {/* Architecture Info & Storage Policy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-mono mb-4">
                  Chính Sách Tối Ưu Hóa Dung Lượng
                </h3>
                <ul className="space-y-3 text-xs text-white/70 leading-relaxed font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Tự động giải phóng:</strong> Định kỳ mỗi 30 phút, hệ thống tự động quét và xóa sạch ảnh của phiên quá 24h.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Bảo mật riêng tư khách hàng:</strong> Không lưu trữ vĩnh viễn hình ảnh nhạy cảm trên máy chủ công cộng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Nén thông minh:</strong> Tự động loại bỏ dataUrl base64 sau khi xuất file nhị phân PNG nhằm tối ưu hóa bộ nhớ heap.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#121215] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-mono mb-4">
                  Thông Tin Tích Hợp Canva API
                </h3>
                <div className="space-y-3 text-xs text-white/70 font-mono">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Canva Token Status:</span>
                    <span className="text-emerald-400 font-bold">
                      {overview.config?.canvaConfigured ? 'Đã Cấu Hình (.env)' : 'Chưa cấu hình'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Backend Port:</span>
                    <span className="text-white">{overview.config?.port || 5000}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/40">Thư Mục Ảnh Riêng Tư:</span>
                    <span className="text-white/60 truncate max-w-[200px]">{overview.storage?.storagePath}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE MANAGEMENT */}
        {activeTab === 'templates' && (
          <div className="space-y-8 animate-fade-in">
            {/* Create Template Form */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400 font-mono">+</span> Thêm Khung Mẫu Mới (Canva Template)
              </h3>
              <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-white/50 mb-1">TÊN KHUNG MẪU</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="VD: Vintage 4-Shot Noir..."
                    className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">SỐ KHUNG HÌNH</label>
                  <select
                    value={newTemplate.slots}
                    onChange={(e) => setNewTemplate({ ...newTemplate, slots: parseInt(e.target.value) })}
                    className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                  >
                    <option value={2}>2 Khung Hình</option>
                    <option value={3}>3 Khung Hình</option>
                    <option value={4}>4 Khung Dọc (Classic)</option>
                    <option value={6}>6 Khung Hình (Lưới)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-white/50 mb-1">CANVA DESIGN ID</label>
                  <input
                    type="text"
                    value={newTemplate.canvaDesignId}
                    onChange={(e) => setNewTemplate({ ...newTemplate, canvaDesignId: e.target.value })}
                    placeholder="VD: DAFxxxxxxx"
                    className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition font-mono disabled:opacity-50"
                  >
                    Lưu Khung Mẫu
                  </button>
                </div>
              </form>
            </div>

            {/* Template List */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <span className="text-xs font-mono text-white/60 uppercase tracking-wider">
                  Danh Sách Khung Mẫu Đang Có ({templates.length})
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-12 rounded border border-white/20 bg-black flex items-center justify-center text-[10px] font-mono text-white/40">
                        {tpl.slots}F
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-white/40 font-mono mt-0.5">
                          <span>{tpl.orientation === 'vertical' ? 'Khung Dọc' : 'Khung Ngang'}</span>
                          <span>•</span>
                          <span>{tpl.slots} Vị trí ảnh</span>
                          {tpl.canvaDesignId && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">Canva: {tpl.canvaDesignId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                        tpl.isActive
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                          : 'border-white/10 text-white/40'
                      }`}>
                        {tpl.isActive ? 'ĐANG DÙNG' : 'TẮT'}
                      </span>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-2 text-white/40 hover:text-red-400 transition"
                        title="Xóa khung mẫu"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FILTER MANAGEMENT */}
        {activeTab === 'filters' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <span className="text-xs font-mono text-white/60 uppercase tracking-wider">
                  Cấu Hình Bộ Lọc Màu Kiosk ({filters.length})
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {filters.map((f) => (
                  <div key={f.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                    <div>
                      <h4 className="text-sm font-bold text-white">{f.name}</h4>
                      <div className="text-xs text-white/40 font-mono mt-0.5">
                        Mã hiệu: <code className="text-amber-400">{f.id}</code> | CSS: <code className="text-white/30">{f.cssFilter || 'none'}</code>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFilter(f.id, f.isActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition border ${
                        f.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {f.isActive ? '✓ ĐANG BẬT' : '✕ ĐANG TẮT'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
