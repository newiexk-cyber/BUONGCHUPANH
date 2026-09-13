# 📡 TÀI LIỆU REST API (PHIÊN BẢN 1 - V1)

Base URL: `http://localhost:3000/api/v1`

---

## 1. System Health & Config

### `GET /health`
Kiểm tra trạng thái sẵn sàng của hệ thống.
- **Phản hồi mẫu (200 OK)**:
```json
{
  "status": "OK",
  "timestamp": "2026-09-13T09:00:00.000Z",
  "uptime": 3600.42,
  "version": "1.0.0",
  "environment": "production"
}
```

### `GET /config/public`
Lấy thông tin cấu hình công khai cho Frontend Kiosk.
- **Phản hồi mẫu (200 OK)**:
```json
{
  "success": true,
  "appName": "BUỒNG CHỤP ẢNH — 35MM ANALOG KIOSK",
  "version": "2.0.0",
  "maxUploadPayloadMB": 35,
  "sessionRetentionHours": 24,
  "features": {
    "canvaIntegration": true,
    "magicBytesValidation": true,
    "sessionIsolation": true
  }
}
```

---

## 2. Session Management

### `POST /session/start`
Khởi tạo phiên chụp ảnh mới và nhận Session ID + Cookie bảo mật.
- **Request Body**:
```json
{
  "kioskId": "KIOSK-HA-NOI-01"
}
```
- **Phản hồi mẫu (200 OK)**:
```json
{
  "success": true,
  "sessionId": "4f9d2b8e-3c2a-4a61-8b6b-4e1b2c3d4e5f",
  "expiresInMs": 86400000,
  "message": "Phiên làm việc đã được khởi tạo thành công."
}
```

---

## 3. Photo Archiving & Retrieval

### `POST /photos/archive`
Lưu trữ ảnh đã hoàn thiện (300 DPI PNG hoặc Boomerang GIF) vào kho lưu trữ an toàn.
- **Headers**:
  - `X-Session-ID`: (Tùy chọn nếu đã có cookie `pb_session_id`)
  - `Content-Type`: `application/json`
- **Request Body**:
```json
{
  "sessionId": "4f9d2b8e-3c2a-4a61-8b6b-4e1b2c3d4e5f",
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "filename": "strip_print.png",
  "caption": "MÈO BÉO & HỘI BẠN THÂN"
}
```
- **Phản hồi mẫu (200 OK)**:
```json
{
  "success": true,
  "photo": {
    "fileId": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
    "filename": "strip_9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d.png",
    "sessionId": "4f9d2b8e-3c2a-4a61-8b6b-4e1b2c3d4e5f",
    "sizeBytes": 1048576,
    "format": "png",
    "caption": "MÈO BÉO & HỘI BẠN THÂN",
    "createdAt": "2026-09-13T09:05:00.000Z",
    "downloadUrl": "/api/v1/photos/view/9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d?sessionId=4f9d2b8e-3c2a-4a61-8b6b-4e1b2c3d4e5f"
  }
}
```

### `GET /photos/view/:fileId?sessionId=...`
Tải/Xem trực tiếp file ảnh thuộc phiên làm việc được ủy quyền.
- **Query Params**: `sessionId`
- **Response**: Stream file ảnh (MIME `image/png` hoặc `image/gif`)

---

## 4. Canva Integration Proxy

### `POST /canva/proxy-export`
Tải thiết kế mẫu từ Canva về Buồng Chụp mà không làm lộ Access Token.
- **Request Body**:
```json
{
  "designId": "DAGd0XXXXXX"
}
```
- **Phản hồi mẫu (200 OK)**:
```json
{
  "success": true,
  "dataUrl": "data:image/png;base64,...",
  "name": "Khung Sinh Nhật Canva Custom"
}
```
