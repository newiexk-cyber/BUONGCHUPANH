/**
 * CENTRALIZED API CLIENT SERVICE
 * Encapsulates all RESTful communication with the 3-tier Backend API.
 * Configured dynamically via NEXT_PUBLIC_API_URL.
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // When running in browser:
    // If on HTTPS (Cloudflare Tunnel) or accessed via Nginx (port 80), ALWAYS use relative '/api/v1'
    // to guarantee same-origin requests, zero Mixed Content errors and zero CORS issues.
    if (window.location.protocol === 'https:' || window.location.port !== '3000') {
      return '/api/v1';
    }
    return window.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper request wrapper with standardized JSON error parsing
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `Lỗi yêu cầu HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[API REQUEST ERROR] ${options.method || 'GET'} ${url}:`, err.message);
      throw err;
    }
  }

  // --- PUBLIC STUDIO METHODS ---

  async checkHealth() {
    return this.request('/health');
  }

  async getPublicConfig() {
    return this.request('/config/public');
  }

  async getTemplates() {
    return this.request('/templates');
  }

  async getFilters() {
    return this.request('/filters');
  }

  async startSession(kioskId = 'KIOSK_ZUMPPI_01') {
    return this.request('/session/start', {
      method: 'POST',
      body: JSON.stringify({ kioskId })
    });
  }

  async archivePhoto({ sessionId, dataUrl, filename, caption }) {
    return this.request('/photos/archive', {
      method: 'POST',
      headers: {
        'X-Session-ID': sessionId || ''
      },
      body: JSON.stringify({
        sessionId,
        dataUrl,
        filename: filename || `print_${Date.now()}.png`,
        caption: caption || ''
      })
    });
  }

  getPhotoViewUrl(fileId, sessionId) {
    return `${this.baseUrl}/photos/view/${fileId}?sessionId=${encodeURIComponent(sessionId)}`;
  }

  async exportCanvaDesign(designId) {
    return this.request('/canva/proxy-export', {
      method: 'POST',
      body: JSON.stringify({ designId })
    });
  }

  async triggerCameraHardware() {
    return this.request('/camera/trigger', {
      method: 'POST'
    }).catch(() => ({}));
  }

  // --- ADMIN METHODS (PROTECTED BY ADMIN SECRET KEY) ---

  async adminGetOverview(adminKey) {
    return this.request('/admin/overview', {
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminGetTemplates(adminKey) {
    return this.request('/admin/templates', {
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminSaveTemplate(templateData, adminKey) {
    return this.request('/admin/templates', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey },
      body: JSON.stringify(templateData)
    });
  }

  async adminDeleteTemplate(id, adminKey) {
    return this.request(`/admin/templates/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminGetFilters(adminKey) {
    return this.request('/admin/filters', {
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminToggleFilter(id, isActive, adminKey) {
    return this.request(`/admin/filters/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'X-Admin-Key': adminKey },
      body: JSON.stringify({ isActive })
    });
  }

  async adminTriggerCleanup(adminKey) {
    return this.request('/admin/cleanup', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminGetPhotos(adminKey) {
    return this.request('/admin/photos', {
      headers: { 'X-Admin-Key': adminKey }
    });
  }

  async adminDeletePhoto(sessionId, fileId, adminKey) {
    return this.request(`/admin/photos/${sessionId}/${fileId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey }
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
