# 📸 BUỒNG CHỤP ẢNH — 35MM ANALOG PHOTOBOOTH STUDIO KIOSK (ENTERPRISE EDITION)

Hệ thống buồng chụp ảnh Kiosk chuyên nghiệp phong cách Meo Beo Studio & Y2K Photobooth, được xây dựng trên nền tảng **Express.js Backend API Chuẩn Enterprise** kết hợp cùng **Modular Frontend Engine (Zero XSS)**.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

- **14 Bố Cục Đa Dạng Chuẩn Kiosk**: Dải phim 2/3/4/6 ô, Lưới 4/6/8/9 ô, So le 4 ô, Dán tủ 3/4 ô, Khung vòm nghệ thuật, Sổ tay Y2K.
- **50+ Bộ Lọc Màu Phim Analog**: Kodak Gold 200, Fuji Pro 400H, Portra 400, Cinestill 800T, Tokyo Warm, Y2K Flash, B&W High Contrast.
- **Render 300 DPI Chuẩn In Ấn Kiosk & GIF Boomerang HD**: Xuất file ảnh độ phân giải cao cho máy in nhiệt DNP/Canon và ảnh động GIF quá trình chụp.
- **Kho Sticker & Chữ Kéo Thả Đa Điểm**: Hệ thống sticker Y2K, thú cưng, badge typography, hỗ trợ xoay, phóng to/thu nhỏ, xóa trực quan.
- **Tích Hợp Khung Canva An Toàn Tuyệt Đối**: Đồng bộ mẫu khung từ Canva thông qua Proxy Server an toàn, bảo mật 100% Access Token.
- **Bảo Mật Cấp Enterprise**:
  - Magic Bytes binary signature inspection chống tải lên mã độc.
  - Phân lập phiên chụp (Tenant Isolation) với định danh UUID v4.
  - Tự động dọn dẹp ảnh tạm sau 24h (24h Retention Cleanup).
  - Safe DOM Generation triệt tiêu 100% nguy cơ XSS.
  - Helmet CSP, CORS Whitelist, Anti-spoofing Rate Limiting.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18.x trở lên.
- **Trình duyệt**: Google Chrome, Microsoft Edge hoặc Safari hỗ trợ WebRTC và Web Workers.

### 2. Cài Đặt Dependencies
```bash
# Cài đặt thư viện Backend
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)
Tạo file `backend/.env` từ file mẫu `backend/.env.example`:
```env
PORT=3000
NODE_ENV=production
CANVA_ACCESS_TOKEN=your_canva_token_here
SESSION_RETENTION_HOURS=24
STORAGE_PATH=storage
MAX_PAYLOAD_MB=35
```

### 4. Khởi Chạy Server Kiosk
```bash
# Khởi chạy toàn bộ hệ thống (Frontend Kiosk + Backend API)
npm start
```
Mở trình duyệt truy cập: `http://localhost:3000/selfbooth.html`

---

## 🧪 CHẠY BỘ KIỂM THỬ (TEST SUITE)

```bash
# Chạy Unit Test kiểm thử Magic Bytes, Lưu trữ UUID & Auto-cleanup
npm test

# Chạy Playwright E2E Suite (Toàn bộ luồng chụp ảnh & xuất file)
npm run test:e2e
```

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
online-photobooth/
├── backend/                  # Enterprise Express.js API
│   ├── src/
│   │   ├── config/           # Cấu hình tập trung (.env)
│   │   ├── controllers/      # REST API Controllers (Session, Photo, Canva, Health)
│   │   ├── middlewares/      # Session Isolation, Rate Limit, Error Handling
│   │   ├── routes/           # Định tuyến API v1
│   │   ├── services/         # Storage, Canva Proxy, Cleanup Retention
│   │   └── utils/            # Magic Bytes Validator, Logger
│   ├── storage/              # Lưu trữ ảnh private theo session (Không public trực tiếp)
│   └── server.js             # Entrypoint Backend
├── js/                       # Modular Frontend Engine
│   ├── core/                 # Audio Effects, Camera Manager, GIF Encoder
│   ├── engine/               # Filter Engine (50 bộ lọc), Frame Renderer (300 DPI)
│   ├── modules/              # Sticker Studio, Frame Vault, Selfbooth Controller
│   ├── state/                # Centralized Session Store (State Machine)
│   └── utils/                # XSS Sanitizer, DOM Builder
├── docs/                     # Tài liệu kỹ thuật chi tiết
│   ├── architecture.md       # Thiết kế kiến trúc & luồng dữ liệu
│   ├── api.md                # Tài liệu REST API v1
│   └── camera-setup.md       # Hướng dẫn thiết lập máy ảnh & Kiosk
├── tests/                    # Bộ kiểm thử Unit & Playwright E2E
├── selfbooth.html            # Giao diện chính Buồng Chụp Ảnh Kiosk
└── server.js                 # Unified Server Runner
```

---

## 📜 GIẤY PHÉP & TÁC QUYỀN
Phát triển bởi đội ngũ Kỹ Sư Hệ Thống Buồng Chụp Ảnh. Bảo lưu mọi quyền theo quy chuẩn Enterprise Software.
