# 📸 BUỒNG CHỤP ẢNH — ZUMP.PI PRODUCTION PHOTOBOOTH ENTERPRISE

Hệ thống buồng chụp ảnh Kiosk cao cấp phong cách **Zump.pi Production Studio** (`https://zumppi.vn/`), được phân tách độc lập hoàn toàn giữa **Backend 3 Tầng (Controller - Service - Repository)** và **Frontend Next.js 14 App Router**, triển khai tiêu chuẩn với **Docker Compose & Nginx Reverse Proxy**.

---

## 🌟 ĐẶC ĐIỂM KIẾN TRÚC DOANH NGHIỆP

1. **Phân Tách Độc Lập Frontend & Backend**:
   - `frontend/`: Ứng dụng Next.js 14 App Router, giao diện Dark Minimalist phong cách studio Zump.pi (`#0a0a0a`), typography sang trọng, nút chụp dính cố định dưới màn hình (`Sticky Shutter Bar`), bộ chuyển đổi camera chuyên dụng và trang tải ảnh QR cho khách.
   - `backend/`: API Express.js theo mô hình **3 Tầng Chuẩn (Controller ➔ Service ➔ Repository)**, kiểm soát phân quyền Admin, dọn dẹp dung lượng tự động và bảo mật Token Canva an toàn 100%.

2. **Bảng Quản Trị Hệ Thống (Admin Dashboard `/admin`)**:
   - Xác thực bảo mật qua `Admin Secret Key` (hoặc header `X-Admin-Key`).
   - Giám sát dung lượng ổ đĩa lưu trữ (MB), RAM Node.js, tổng số phiên chụp, file ảnh và thời gian hoạt động.
   - Quản trị khung mẫu (Canva Design ID, số lượng slot, định hướng ngang/dọc, bật/tắt).
   - Quản trị bộ lọc màu phim analog.
   - Dọn dẹp tức thì ảnh hết hạn lưu trữ (24h Retention Cleanup).

3. **Chuyên Nghiệp Hóa Giao Diện & Kiosk Mobile**:
   - Tone màu đen kim loại sang trọng, không hoạt họa, không hiệu ứng AI trẻ con.
   - Cần chụp ảnh luôn nổi cố định ở mép dưới (`sticky bottom`), thao tác 1 chạm trên mọi màn hình cảm ứng hoặc tablet.
   - Hỗ trợ đổi camera trước/sau/webcam ngoài ngay trên giao diện.
   - Chế độ Studio Ảo Demo tích hợp sẵn khi chạy trên môi trường không có webcam vật lý.

4. **Containerization & Nginx**:
   - Dockerfile riêng cho Backend và Frontend.
   - Nginx Reverse Proxy điều hướng cổng 80, bộ nhớ đệm static assets Next.js, proxy API an toàn và hỗ trợ payload 50MB cho ảnh in 300 DPI.
   - Khởi chạy đồng bộ chỉ bằng 1 lệnh chuẩn `docker compose up -d --build`.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY BẰNG DOCKER

### 1. Khởi chạy toàn bộ hệ thống qua Docker Compose
```bash
docker compose up -d --build
```

- **Frontend Kiosk Studio**: `http://localhost:3000/studio` (hoặc `http://localhost/studio` qua Nginx)
- **Admin Dashboard**: `http://localhost:3000/admin` (Mã bí mật mặc định: `zumppi_photobooth_secure_key_2026`)
- **Trang Tải Ảnh QR Mobile**: `http://localhost:3000/download`
- **Backend REST API**: `http://localhost:5000/api/v1`

---

## 💻 HƯỚNG DẪN CHẠY CỤC BỘ (LOCAL DEVELOPMENT)

### Cấu hình biến môi trường
Tạo file `.env` ở Backend và Frontend:
- `backend/.env`: `PORT=5000`, `ADMIN_SECRET_KEY=zumppi_photobooth_secure_key_2026`, `SESSION_RETENTION_HOURS=24`
- `frontend/.env.local`: `PORT=3000`, `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`

### Khởi chạy Backend (Port 5000):
```bash
cd backend
npm install
npm start
```

### Khởi chạy Frontend Next.js (Port 3000):
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 KIỂM THỬ ĐƠN VỊ (CORE UNIT TESTS)
```bash
# Chạy bộ test native kiểm thử 3 Tầng, Magic Bytes, UUID Isolation, Admin Telemetry & Auto-cleanup
node tests/unit/core.test.js
```

---

## 📁 CẤU TRÚC DỰ ÁN MỚI

```
online-photobooth/
├── docker-compose.yml        # Điều phối Docker chuẩn: Backend, Frontend, Nginx
├── nginx.conf                # Cấu hình Nginx Reverse Proxy & Gateway
├── .env.example              # Biến môi trường mẫu
│
├── backend/                  # 3-TIER BACKEND API (PORT 5000)
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── storage/              # Lưu trữ ảnh private (photos, templates, data)
│   └── src/
│       ├── controllers/      # Tầng Điều Hướng & Nhận Request (Admin, Photo, Session)
│       ├── services/         # Tầng Nghiệp Vụ (Admin, Photo, Cleanup, Canva)
│       ├── repositories/     # Tầng Truy Xuất Dữ Liệu File I/O (Photo, Template)
│       ├── middlewares/      # Phân quyền Admin Auth, Session Isolation
│       ├── config/           # Cấu hình tập trung (.env)
│       └── utils/            # Magic Bytes Validator, Logger
│
├── frontend/                 # NEXT.JS 14 APP ROUTER FRONTEND (PORT 3000)
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── nginx.conf
│   └── src/
│       ├── app/
│       │   ├── page.js       # Trang chủ giới thiệu chuẩn Zump.pi Production
│       │   ├── studio/       # Kiosk Studio chụp ảnh (Sticky Shutter, Switch Camera)
│       │   ├── admin/        # Dashboard Quản Trị (Storage, Canva Templates, Filters)
│       │   ├── download/     # Trang Tải Ảnh QR Mobile cho khách hàng
│       │   └── globals.css   # Hệ màu Dark Luxury Minimalist
│       └── services/
│           └── api.js        # API Client tập trung kết nối Backend linh hoạt
│
└── tests/                    # Bộ kiểm thử Unit & Integration
```

---

## 📜 BẢN QUYỀN
Phát triển theo tiêu chuẩn kiến trúc phần mềm doanh nghiệp Zump.pi Production.
