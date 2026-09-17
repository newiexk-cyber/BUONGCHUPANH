/**
 * TEMPLATE & FILTER REPOSITORY (DATA ACCESS LAYER)
 * Manages persistent storage for Studio Templates, Canva Designs, and Filters.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class TemplateRepository {
  constructor() {
    this.dataFile = path.join(config.paths.dataDir, 'templates.json');
    this.filtersFile = path.join(config.paths.dataDir, 'filters.json');
    this.initDefaults();
  }

  initDefaults() {
    if (!fs.existsSync(this.dataFile)) {
      const defaultTemplates = [
        {
          id: 'tpl_zumppi_signature',
          name: 'Zump.pi Editorial Studio (35mm Film)',
          category: 'analog',
          tag: 'DẢI 4 Ô',
          canvaDesignId: 'DAGd0ZUMPPI01',
          isActive: true,
          createdAt: Date.now()
        },
        {
          id: 'tpl_birthday',
          name: '🎂 Sinh Nhật Party Minimalist',
          category: 'party',
          tag: 'DẢI 4 Ô',
          canvaDesignId: '',
          isActive: true,
          createdAt: Date.now()
        },
        {
          id: 'tpl_y2k_cyber',
          name: '✨ Y2K Cyber Angel',
          category: 'y2k',
          tag: 'DẢI 4 Ô',
          canvaDesignId: '',
          isActive: true,
          createdAt: Date.now()
        }
      ];
      fs.writeFileSync(this.dataFile, JSON.stringify(defaultTemplates, null, 2), 'utf8');
    }

    if (!fs.existsSync(this.filtersFile)) {
      const defaultFilters = [
        { id: 'goc', name: 'Gốc (Raw)', category: 'analog', isDefault: true, isActive: true },
        { id: 'kodak200', name: 'Kodak Gold 200', category: 'analog', isDefault: false, isActive: true },
        { id: 'fuji400', name: 'Fuji Pro 400H', category: 'analog', isDefault: false, isActive: true },
        { id: 'cinestill', name: 'CineStill 800T', category: 'cinematic', isDefault: false, isActive: true },
        { id: 'portra400', name: 'Portra 400', category: 'portrait', isDefault: false, isActive: true },
        { id: 'ilford', name: 'Ilford HP5 B&W', category: 'monochrome', isDefault: false, isActive: true },
        { id: 'minda', name: 'Mịn Da (Glow)', category: 'beauty', isDefault: false, isActive: true },
        { id: 'trongveo', name: 'Trong Veo Hàn Quốc', category: 'beauty', isDefault: false, isActive: true }
      ];
      fs.writeFileSync(this.filtersFile, JSON.stringify(defaultFilters, null, 2), 'utf8');
    }
  }

  async getAllTemplates() {
    try {
      const raw = await fs.promises.readFile(this.dataFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  async saveTemplate(template) {
    const templates = await this.getAllTemplates();
    const idx = templates.findIndex(t => t.id === template.id);

    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...template, updatedAt: Date.now() };
    } else {
      templates.push({
        id: template.id || `tpl_${Date.now()}`,
        name: template.name || 'Mẫu Mới',
        category: template.category || 'custom',
        tag: template.tag || 'DẢI 4 Ô',
        canvaDesignId: template.canvaDesignId || '',
        dataUrl: template.dataUrl || '',
        isActive: template.isActive !== false,
        createdAt: Date.now()
      });
    }

    await fs.promises.writeFile(this.dataFile, JSON.stringify(templates, null, 2), 'utf8');
    return templates;
  }

  async deleteTemplate(id) {
    let templates = await this.getAllTemplates();
    templates = templates.filter(t => t.id !== id);
    await fs.promises.writeFile(this.dataFile, JSON.stringify(templates, null, 2), 'utf8');
    return true;
  }

  async getAllFilters() {
    try {
      const raw = await fs.promises.readFile(this.filtersFile, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  async updateFilterStatus(id, isActive) {
    const filters = await this.getAllFilters();
    const f = filters.find(item => item.id === id);
    if (f) {
      f.isActive = !!isActive;
      await fs.promises.writeFile(this.filtersFile, JSON.stringify(filters, null, 2), 'utf8');
    }
    return filters;
  }
}

module.exports = new TemplateRepository();
