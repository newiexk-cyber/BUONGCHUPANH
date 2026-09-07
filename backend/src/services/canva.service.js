/**
 * CANVA CONNECT API PROXY SERVICE
 * Calls Canva REST API securely from server-side without exposing API keys to browser.
 */

const config = require('../config');

class CanvaService {
  /**
   * Proxies design export job to Canva Connect API
   */
  async exportDesign(designId, tokenOverride = null) {
    const token = tokenOverride || config.canva.accessToken;

    if (!designId) {
      throw new Error('Thiếu Design ID thiết kế Canva.');
    }

    if (!token) {
      throw new Error('Chưa cấu hình Canva Access Token trên máy chủ.');
    }

    // Clean design ID if URL was provided
    let cleanId = designId;
    const match = designId.match(/design\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    try {
      const response = await fetch(`${config.canva.apiBaseUrl}/exports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          design_id: cleanId,
          format: { type: 'png' }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        return {
          success: false,
          designId: cleanId,
          message: `Canva API phản hồi HTTP ${response.status}: ${errBody}`,
          isMockReady: true
        };
      }

      const data = await response.json();
      return {
        success: true,
        designId: cleanId,
        job: data.job,
        exportUrl: data.job?.urls?.[0] || null
      };
    } catch (err) {
      return {
        success: false,
        designId: cleanId,
        message: `Lỗi kết nối Canva Server: ${err.message}`,
        isMockReady: true
      };
    }
  }
}

module.exports = new CanvaService();
