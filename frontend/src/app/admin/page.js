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
    setTemplates(templatesData.data?.list || templatesData.data || []);
    setFilters(filtersData.data?.list || filtersData.data || []);
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
      setTemplates(res.data?.list || res.data || []);
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
      notify('Đã xóa khung mẫu thành công');
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
      notify(`Đã ${newStatus ? 'bật' : 'tắt'} bộ lọc thành công`);
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
        padding: '24px',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#141416',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '40px 32px',
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                  textDecoration: 'none'
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
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100,
          padding: '14px 20px',
          borderRadius: '14px',
          border: actionNotice.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          background: actionNotice.type === 'error' ? 'rgba(30, 10, 10, 0.95)' : 'rgba(25, 20, 10, 0.95)',
          color: actionNotice.type === 'error' ? '#f87171' : '#fbbf24',
          fontSize: '0.84rem',
          fontWeight: 700,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)'
        }}>
          {actionNotice.msg}
        </div>
      )}

      {/* Top Header */}
      <header style={{
        background: 'rgba(18, 18, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              href="/studio" 
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                background: '#18181b',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              ← Về Studio
            </Link>
            <div style={{ height: '18px', width: '1px', background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                ZUMP.PI ADMIN DASHBOARD
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                v2.5 Kiosk Pro
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleTriggerCleanup}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#18181b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                color: 'var(--accent-gold)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Dọn dẹp session và ảnh tạm đã lưu quá 24h"
            >
              🧹 Dọn Dẹp Dung Lượng
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đăng Xuất
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '14px 4px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-gold)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'overview' ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📊 HỆ THỐNG & DUNG LƯỢNG
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '14px 4px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'templates' ? '2px solid var(--accent-gold)' : '2px solid transparent',
              color: activeTab === 'templates' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'templates' ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖼️ KHUNG MẪU TEMPLATE ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            style={{
              padding: '14px 4px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'filters' ? '2px solid var(--accent-gold)' : '2px solid transparent',
              color: activeTab === 'filters' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'filters' ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🎨 BỘ LỌC MÀU FILTER ({filters.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        padding: '32px 24px'
      }}>
        {/* TAB 1: OVERVIEW & STORAGE METRICS */}
        {activeTab === 'overview' && overview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Metric KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '18px'
            }}>
              {/* Card 1: Dung Lượng */}
              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  💾 Dung Lượng Lưu Trữ
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '8px' }}>
                  {overview.storage?.usedMB || overview.storage?.storageUsedMB || '0.00'} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dim)' }}>MB</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  Tự động dọn dẹp sau: <strong>{overview.storage?.retentionHours || 24} giờ</strong>
                </div>
              </div>

              {/* Card 2: Session */}
              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  📸 Tổng Session Đã Tạo
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>
                  {overview.storage?.totalSessions || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>●</span> Máy chủ hoạt động ổn định
                </div>
              </div>

              {/* Card 3: File ảnh */}
              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🎞️ File Ảnh Trong Kiosk
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>
                  {overview.storage?.totalPhotos || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  Tiêu chuẩn: <strong>PNG 300 DPI High-Res</strong>
                </div>
              </div>

              {/* Card 4: RAM */}
              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ⚡ RAM Sử Dụng (Node.js)
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>
                  {overview.system?.memoryUsageMB || overview.system?.memoryUsedMB || '56'} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dim)' }}>MB</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  Uptime: <strong>{Math.floor((overview.system?.uptimeSeconds || 0) / 60)} phút</strong>
                </div>
              </div>
            </div>

            {/* Architecture Info & Storage Policy */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Chính Sách Tối Ưu Hóa Bộ Nhớ
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: '#ffffff' }}>✓ Tự động giải phóng:</strong> Mỗi 30 phút, hệ thống tự động quét và dọn dẹp các session ảnh đã lưu quá 24h để giải phóng ổ cứng.
                  </div>
                  <div>
                    <strong style={{ color: '#ffffff' }}>✓ Bảo mật quyền riêng tư:</strong> Ảnh chỉ phục vụ khách quét mã tải về trong ngày, không lưu trữ vĩnh viễn trên máy chủ.
                  </div>
                  <div>
                    <strong style={{ color: '#ffffff' }}>✓ Tối ưu hiệu năng:</strong> Xuất file nhị phân PNG và nén bộ nhớ đệm tự động giúp máy chạy mượt mà 24/7.
                  </div>
                </div>
              </div>

              <div style={{
                background: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Thông Số Cấu Hình Hệ Thống
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Môi trường chạy:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>Docker Container (Node.js 20)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cổng Backend nội bộ:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>Port 5000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reverse Proxy Gateway:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>Nginx Port 80 & Cloudflare Tunnel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE MANAGEMENT */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Create Template Form Card */}
            <div style={{
              background: '#141416',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-gold)' }}>+</span> Thêm Mẫu Khung In Mới
              </h3>
              <form onSubmit={handleCreateTemplate} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                alignItems: 'end'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Tên Khung Mẫu
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="VD: Vintage 4-Cut Classic..."
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '0.84rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Số Khung Hình
                  </label>
                  <select
                    value={newTemplate.slots}
                    onChange={(e) => setNewTemplate({ ...newTemplate, slots: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '0.84rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value={2}>2 Khung Hình (Dải đôi)</option>
                    <option value={3}>3 Khung Hình (Dải 3 ô)</option>
                    <option value={4}>4 Khung Dọc (Dải film 4 ô)</option>
                    <option value={4}>4 Khung Vuông (Lưới 2x2)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Canva Design ID (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.canvaDesignId}
                    onChange={(e) => setNewTemplate({ ...newTemplate, canvaDesignId: e.target.value })}
                    placeholder="VD: DAGd0xxxxxx"
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '0.84rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Lưu Khung Mẫu Mới
                  </button>
                </div>
              </form>
            </div>

            {/* Template List Card */}
            <div style={{
              background: '#141416',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Danh Sách Khung Mẫu Hiện Có ({templates.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {templates.map((tpl, idx) => (
                  <div 
                    key={tpl.id || idx} 
                    style={{
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: idx === templates.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '42px',
                        height: '52px',
                        borderRadius: '6px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        background: '#0a0a0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold)'
                      }}>
                        {tpl.slots || 4}F
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{tpl.name}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                          <span>{tpl.orientation === 'vertical' ? 'Khung Dọc' : 'Khung Ngang / Vuông'}</span>
                          <span>•</span>
                          <span>{tpl.slots || 4} vị trí ảnh</span>
                          {tpl.canvaDesignId && (
                            <>
                              <span>•</span>
                              <span style={{ color: 'var(--accent-gold)' }}>Canva: {tpl.canvaDesignId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        background: tpl.isActive !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        color: tpl.isActive !== false ? '#10b981' : 'var(--text-dim)',
                        border: tpl.isActive !== false ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)'
                      }}>
                        {tpl.isActive !== false ? '✓ ĐANG DÙNG' : 'TẮT'}
                      </span>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '8px',
                          fontSize: '1rem'
                        }}
                        title="Xóa khung mẫu này"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: '#141416',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Cấu Hình Bật / Tắt Bộ Lọc Màu Trên Máy Kiosk ({filters.length})</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold)', textTransform: 'none' }}>
                  Bấm để bật hoặc ẩn màu trên máy khách
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filters.map((f, idx) => (
                  <div 
                    key={f.id || idx} 
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: idx === filters.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>{f.name}</h4>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Mã Filter: <code style={{ color: 'var(--accent-gold)' }}>{f.id}</code> | Phân loại: <span>{f.category || 'analog'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFilter(f.id, f.isActive)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: f.isActive !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: f.isActive !== false ? '#10b981' : 'var(--text-dim)',
                        border: f.isActive !== false ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      {f.isActive !== false ? '✓ ĐANG BẬT' : '✕ ĐÃ TẮT'}
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
