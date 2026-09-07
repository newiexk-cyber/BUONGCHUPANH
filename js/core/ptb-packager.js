/**
 * PTB PACKAGER ENGINE
 * Đóng gói và giải nén định dạng tệp .ptb (Photo Booth Project) bằng JSZip
 */

(function(window) {
  class PtbPackager {
    /**
     * Đóng gói và tải file .ptb
     */
    static async exportProject(data, filename = 'photobooth-session.ptb') {
      if (typeof window.JSZip === 'undefined') {
        throw new Error('JSZip library chưa được nạp!');
      }

      const zip = new window.JSZip();

      // 1. Manifest
      const manifest = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        mode: data.mode || 'id-photo',
        canvas: data.canvas || { width: 1200, height: 1600, dpi: 300 },
        settings: data.settings || {},
        metadata: {
          title: data.title || 'Photo Booth Session',
          author: 'Online Photo Booth Studio'
        }
      };
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));

      // 2. Original photos
      const originalFolder = zip.folder('original');
      if (data.originalImages && data.originalImages.length > 0) {
        data.originalImages.forEach((img, idx) => {
          const name = img.name || `shot_${idx + 1}.jpg`;
          if (img.blob) {
            originalFolder.file(name, img.blob);
          } else if (img.dataUrl) {
            const base64Data = img.dataUrl.replace(/^data:image\/\w+;base64,/, '');
            originalFolder.file(name, base64Data, { base64: true });
          }
        });
      }

      // 3. Processed result preview
      if (data.processedBlob) {
        zip.file('preview.jpg', data.processedBlob);
      } else if (data.processedDataUrl) {
        const base64 = data.processedDataUrl.replace(/^data:image\/\w+;base64,/, '');
        zip.file('preview.jpg', base64, { base64: true });
      }

      // 4. Custom assets (Áo hoặc viền khung)
      const assetsFolder = zip.folder('assets');
      if (data.suitAsset) {
        assetsFolder.file('suit.png', data.suitAsset);
      }
      if (data.customFrame) {
        assetsFolder.file('frame.png', data.customFrame);
      }

      // 5. Generate and download
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const validFilename = filename.endsWith('.ptb') ? filename : `${filename}.ptb`;
      this.triggerDownload(zipBlob, validFilename);
      return zipBlob;
    }

    /**
     * Đọc tệp .ptb khi người dùng nạp vào
     */
    static async importProject(file) {
      if (typeof window.JSZip === 'undefined') {
        throw new Error('JSZip library chưa được nạp!');
      }

      const zip = await window.JSZip.loadAsync(file);

      // 1. Đọc manifest
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('Tệp không đúng định dạng .ptb: Thiếu manifest.json');
      }
      const manifestJson = await manifestFile.async('string');
      const manifest = JSON.parse(manifestJson);

      // 2. Đọc ảnh gốc
      const originalImages = [];
      const originalFiles = zip.file(/^original\/.+/);
      for (const f of originalFiles) {
        const blob = await f.async('blob');
        const filename = f.name.replace('original/', '');
        const dataUrl = await this.blobToDataUrl(blob);
        originalImages.push({ name: filename, blob, dataUrl });
      }

      // 3. Đọc preview
      let previewDataUrl = null;
      const previewFile = zip.file('preview.jpg');
      if (previewFile) {
        const previewBlob = await previewFile.async('blob');
        previewDataUrl = await this.blobToDataUrl(previewBlob);
      }

      return {
        manifest,
        originalImages,
        previewDataUrl
      };
    }

    static blobToDataUrl(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    static triggerDownload(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  window.PtbPackager = PtbPackager;
})(window);
