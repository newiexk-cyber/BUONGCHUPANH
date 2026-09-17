/**
 * ADMIN BUSINESS LOGIC SERVICE
 * Manages dashboard analytics, storage controls, filter presets, and Canva template configurations.
 */

const photoRepository = require('../repositories/photo.repository');
const templateRepository = require('../repositories/template.repository');
const cleanupService = require('./cleanup.service');

class AdminService {
  /**
   * Aggregates real-time operational statistics for the Admin Dashboard
   */
  async getDashboardOverview() {
    const storageMetrics = await photoRepository.getStorageMetrics();
    const templates = await templateRepository.getAllTemplates();
    const filters = await templateRepository.getAllFilters();

    const usedMB = (storageMetrics.totalBytes / (1024 * 1024)).toFixed(2);

    return {
      storage: {
        totalBytes: storageMetrics.totalBytes,
        usedMB: parseFloat(usedMB),
        totalSessions: storageMetrics.totalSessions,
        totalPhotos: storageMetrics.totalPhotos,
        retentionHours: 24
      },
      templates: {
        total: templates.length,
        active: templates.filter(t => t.isActive).length,
        list: templates
      },
      filters: {
        total: filters.length,
        active: filters.filter(f => f.isActive).length,
        list: filters
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        nodeVersion: process.version
      }
    };
  }

  async getTemplates() {
    return templateRepository.getAllTemplates();
  }

  async saveTemplate(templateData) {
    return templateRepository.saveTemplate(templateData);
  }

  async deleteTemplate(id) {
    return templateRepository.deleteTemplate(id);
  }

  async getFilters() {
    return templateRepository.getAllFilters();
  }

  async toggleFilter(id, isActive) {
    return templateRepository.updateFilterStatus(id, isActive);
  }

  async triggerStorageCleanup() {
    return cleanupService.runCleanupNow();
  }
}

module.exports = new AdminService();
