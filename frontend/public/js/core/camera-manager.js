/**
 * CAMERA MANAGER & TETHERING ENGINE
 * Quản lý Webcam HD, kết nối máy ảnh WebUSB PTP và WebSocket DSLR Studio Bridge
 */

(function(window) {
  class CameraManager {
    constructor() {
      this.stream = null;
      this.videoElement = null;
      this.webUsbDevice = null;
      this.wsBridge = null;
      this.onPhotoReceived = null;
      this.state = {
        connected: false,
        sourceType: 'webcam',
        deviceName: 'Chưa kết nối',
        batteryLevel: null,
        isLive: false,
        error: null
      };
      this.listeners = [];
    }

    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.state);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(l => l(this.state));
    }

    async getAvailableVideoDevices() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'videoinput');
      } catch (e) {
        console.warn('Lỗi liệt kê thiết bị camera:', e);
        return [];
      }
    }

    async startWebcam(videoEl, deviceId = null) {
      if (videoEl) this.videoElement = videoEl;
      try {
        if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop());
        }

        const videoConstraints = {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        };

        if (deviceId) {
          videoConstraints.deviceId = { exact: deviceId };
        }

        const constraints = {
          video: videoConstraints,
          audio: false
        };

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (this.videoElement) {
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            try {
              await this.videoElement.play();
            } catch (err) {
              console.log('Video play:', err);
            }
          }

          const track = this.stream.getVideoTracks()[0];
          const label = (track && track.label) || 'Webcam HD / Máy ảnh USB';

          this.state = {
            ...this.state,
            connected: true,
            sourceType: 'webcam',
            deviceName: label,
            isLive: true,
            error: null
          };
          this.notify();
          return true;
        } else {
          throw new Error('MediaDevices API not supported');
        }
      } catch (err) {
        console.warn('Lỗi kết nối camera:', err);
        if (this.videoElement) {
          this.videoElement.style.display = 'none';
        }
        this.state = {
          ...this.state,
          connected: false,
          isLive: false,
          error: err.message
        };
        this.notify();
        return false;
      }
    }

    async connectWebUSB() {
      if (!('usb' in navigator)) {
        this.state.error = 'Trình duyệt của bạn không hỗ trợ WebUSB API.';
        this.notify();
        return false;
      }

      try {
        const device = await navigator.usb.requestDevice({
          filters: [{ classCode: 0x06 }]
        });

        await device.open();
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }
        await device.claimInterface(0);

        this.webUsbDevice = device;
        this.state = {
          ...this.state,
          connected: true,
          sourceType: 'webusb',
          deviceName: device.productName || 'Máy ảnh DSLR USB (PTP)',
          error: null
        };
        this.notify();
        return true;
      } catch (err) {
        console.warn('Lỗi kết nối WebUSB:', err);
        this.state.error = err.message || 'Không thể kết nối máy ảnh qua USB';
        this.notify();
        return false;
      }
    }

    connectLocalDaemon(port = 9123) {
      if (this.wsBridge) {
        this.wsBridge.close();
      }

      const wsUrl = `ws://127.0.0.1:${port}`;
      try {
        this.wsBridge = new WebSocket(wsUrl);
        this.wsBridge.binaryType = 'arraybuffer';

        this.wsBridge.onopen = () => {
          this.state = {
            ...this.state,
            connected: true,
            sourceType: 'websocket-daemon',
            deviceName: 'DSLR Studio Tether Bridge',
            error: null
          };
          this.notify();
        };

        this.wsBridge.onmessage = (event) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'CAMERA_INFO') {
                this.state.deviceName = msg.model || this.state.deviceName;
                this.state.batteryLevel = msg.battery || null;
                this.notify();
              }
            } catch (e) {}
          } else if (event.data instanceof ArrayBuffer) {
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            if (this.onPhotoReceived) {
              this.onPhotoReceived(blob);
            }
          }
        };

        this.wsBridge.onerror = () => {
          this.state.error = 'Không tìm thấy Local Bridge Daemon (ws://127.0.0.1:9123)';
          this.notify();
        };

        this.wsBridge.onclose = () => {
          if (this.state.sourceType === 'websocket-daemon') {
            this.state.connected = false;
            this.notify();
          }
        };
      } catch (e) {}
    }

    captureFrame() {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      if (this.videoElement && this.stream && this.videoElement.videoWidth > 0) {
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      } else {
        this.drawDemoPortrait(ctx, canvas.width, canvas.height);
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve({
            blob,
            dataUrl: canvas.toDataURL('image/jpeg', 0.95),
            width: canvas.width,
            height: canvas.height
          });
        }, 'image/jpeg', 0.95);
      });
    }

    drawDemoPortrait(ctx, w, h) {
      const cx = w / 2;
      // Background dreamy studio gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fdf2f8');
      grad.addColorStop(0.5, '#fae8ff');
      grad.addColorStop(1, '#ede9fe');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Studio spotlight
      const spot = ctx.createRadialGradient(cx, h * 0.45, 50, cx, h * 0.45, w * 0.5);
      spot.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
      spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Hair (Behind)
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(cx, h * 0.4, 220, 0, Math.PI * 2);
      ctx.fill();

      // Cute Shoulders & Top
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.85, 320, 200, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.43, 170, 195, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks (Soft blush)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx - 70, h * 0.46, 35, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 70, h * 0.46, 35, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Anime Eyes
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(cx - 60, h * 0.40, 16, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, h * 0.40, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye Sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 55, h * 0.39, 6, 0, Math.PI * 2);
      ctx.arc(cx + 65, h * 0.39, 6, 0, Math.PI * 2);
      ctx.arc(cx - 63, h * 0.42, 3, 0, Math.PI * 2);
      ctx.arc(cx + 57, h * 0.42, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyelashes
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx - 60, h * 0.38, 20, 0.8 * Math.PI, 0.1 * Math.PI);
      ctx.arc(cx + 60, h * 0.38, 20, 0.9 * Math.PI, 0.2 * Math.PI);
      ctx.stroke();

      // Cute Smile
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, h * 0.47, 36, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Front Bangs
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(cx, h * 0.32, 185, Math.PI, 0);
      ctx.quadraticCurveTo(cx + 140, h * 0.38, cx + 80, h * 0.35);
      ctx.quadraticCurveTo(cx, h * 0.38, cx - 80, h * 0.35);
      ctx.quadraticCurveTo(cx - 140, h * 0.38, cx - 185, h * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    stop() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if (this.webUsbDevice && this.webUsbDevice.opened) {
        this.webUsbDevice.close();
        this.webUsbDevice = null;
      }
      if (this.wsBridge) {
        this.wsBridge.close();
        this.wsBridge = null;
      }
      this.state = {
        connected: false,
        sourceType: 'webcam',
        deviceName: 'Đã ngắt kết nối',
        batteryLevel: null,
        isLive: false,
        error: null
      };
      this.notify();
    }
  }

  window.cameraManager = new CameraManager();
})(window);
