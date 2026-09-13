# 🏛️ TÀI LIỆU KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

## 1. TỔNG QUAN KIẾN TRÚC

Hệ thống Buồng Chụp Ảnh (Photobooth Kiosk) được thiết kế theo mô hình **Client-Server Phân Lập Cấp Enterprise**:

```
+---------------------------------------------------------------------------------+
|                                FRONTEND KIOSK                                   |
|                                                                                 |
|  [Camera Manager / WebRTC]  ---> [Session Store (State Machine)]                |
|               |                                |                                |
|               v                                v                                |
|     [Filter Engine (50)]            [Frame Renderer (300 DPI)]                  |
|               |                                |                                |
|               v                                v                                |
|     [Sticker Studio (DOM)]          [Frame Vault (IndexedDB)]                   |
|               \                                /                                |
|                +------------->+<--------------+                                 |
|                               |                                                 |
|                     [Sanitizer / Safe DOM]                                      |
+-------------------------------|-------------------------------------------------+
                                | HTTPS / JSON + Base64
                                v
+---------------------------------------------------------------------------------+
|                         BACKEND API (EXPRESS.JS)                                |
|                                                                                 |
|  [Helmet CSP & CORS Whitelist] ---> [Anti-Spoofing Rate Limiter]                |
|                                                   |                             |
|  [Session Ownership Middleware] <-----------------+                             |
|          |                                                                      |
|          +----------> [Photo Service] --------> [Magic Bytes Validator]         |
|          |                  |                               |                   |
|          |                  v                               v                   |
|          |        [UUID v4 File Naming]        [Private Storage by Session]     |
|          |                                                  |                   |
|          +----------> [Canva Proxy Service]                 v                   |
|                             |                  [24h Auto-cleanup Worker]        |
|                             v                                                   |
|                   [Canva REST API v1]                                           |
+---------------------------------------------------------------------------------+
```

---

## 2. NGUYÊN TẮC THIẾT KẾ CỐT LÕI

### 2.1 Zero XSS & Safe DOM Builder
- Toàn bộ thao tác thêm phần tử DOM (như Review items, Stickers, Frame cards, Camera options) đều đi qua `Sanitizer.createElement()` hoặc `Sanitizer.escapeHTML()`.
- Không sử dụng `innerHTML` không được kiểm soát với biến đầu vào từ người dùng hoặc API.

### 2.2 Centralized State Machine (`SessionStore`)
Mọi trạng thái studio được quy định rõ ràng qua 6 pha (Phase):
1. **`SETUP`**: Khách hàng chọn bố cục, hiệu ứng filter, hẹn giờ, và nguồn camera.
2. **`SHOOTING`**: Bắt đầu chuỗi chụp tự động 8 lần kèm hiệu ứng countdown, flash, âm thanh motor.
3. **`REVIEW`**: Hiển thị lưới 8 ảnh, cho phép chụp lại (Retake) riêng từng tấm.
4. **`CUSTOMIZE`**: Trang trí sticker, thêm văn bản cá nhân, chọn màu viền và khung mẫu Canva.
5. **`DEVELOPING`**: Quy trình tráng phim phòng tối 35mm (Rendering 300 DPI Canvas & Boomerang GIF).
6. **`RESULT`**: Thành phẩm cuối cùng, cho phép tải PNG in ấn, GIF timelapse và lưu trữ về máy chủ.

### 2.3 Bảo Mật Dữ Liệu & Private Storage
- Ảnh chụp **KHÔNG ĐƯỢC LƯU VÀO THƯ MỤC PUBLIC CỦA WEB SERVER**.
- File được lưu trữ tại `backend/storage/photos/${sessionId}/strip_${UUIDv4}.png`.
- Tải file bắt buộc phải đi qua endpoint `/api/v1/photos/view/:fileId?sessionId=...` có xác thực quyền sở hữu phiên.

### 2.4 Magic Bytes Verification
- Thay vì chỉ tin tưởng Content-Type header từ Client (dễ bị giả mạo), Backend đọc trực tiếp 8 byte đầu tiên của file buffer để xác thực chữ ký nhị phân:
  - **PNG**: `89 50 4E 47 0D 0A 1A 0A`
  - **JPEG**: `FF D8 FF`
  - **GIF**: `47 49 46 38`
  - **WEBP**: `52 49 46 46`

### 2.5 Canva Proxy Bảo Vệ Bí Mật (Secrets Isolation)
- Client Frontend không bao giờ nắm giữ hoặc truyền tải `CANVA_ACCESS_TOKEN`.
- Toàn bộ liên lạc với Canva REST API được thực hiện bởi `canva.service.js` ở tầng Server, đọc token từ biến môi trường `process.env.CANVA_ACCESS_TOKEN`.
