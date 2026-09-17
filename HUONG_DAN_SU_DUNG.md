# 📖 HƯỚNG DẪN SỬ DỤNG & DANH MỤC CHỨC NĂNG HỆ THỐNG BUỒNG CHỤP ẢNH
### **ZUMP.PI PRODUCTION PHOTOBOOTH ENTERPRISE (PHIÊN BẢN 2.5)**

---

## 📑 MỤC LỤC
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Kiến Trúc Kỹ Thuật 3 Tầng & Công Nghệ](#2-kiến-trúc-kỹ-thuật-3-tầng--công-nghệ)
3. [Bảng Tổng Hợp Chức Năng (Feature Matrix)](#3-bảng-tổng-hợp-chức-năng-feature-matrix)
4. [Hướng Dẫn Cài Đặt & Khởi Chạy](#4-hướng-dẫn-cài-đặt--khởi-chạy)
5. [Hướng Dẫn Thao Tác Chi Tiết](#5-hướng-dẫn-thao-tác-chi-tiết)
   - [5.1. Dành Cho Khách Hàng (Kiosk Studio `/studio`)](#51-dành-cho-khách-hàng-kiosk-studio-studio)
   - [5.2. Dành Cho Quản Trị Viên (Admin Dashboard `/admin`)](#52-dành-cho-quản-trị-viên-admin-dashboard-admin)
   - [5.3. Dành Cho Khách Quét Mã Tải Ảnh (`/download`)](#53-dành-cho-khách-quét-mã-tải-ảnh-download)
6. [Cấu Hình Biến Môi Trường (.env)](#6-cấu-hình-biến-môi-trường-env)
7. [Bảo Mật & Tối Ưu Hóa Dung Lượng](#7-bảo-mật--tối-ưu-hóa-dung-lượng)
8. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#8-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. GIỚI THIỆU TỔNG QUAN

**Zump.pi Production Photobooth** là giải pháp phần mềm buồng chụp ảnh Kiosk tự động thương mại chuyên nghiệp, được xây dựng theo phong cách tối giản sang trọng (**Luxury Dark Minimalist** đồng bộ với thương hiệu `https://zumppi.vn/`). 

Hệ thống cung cấp trải nghiệm chụp ảnh 35mm hoài cổ phong cách Hàn Quốc kết hợp công nghệ hiện đại: render ảnh in 300 DPI, ảnh động GIF Boomerang, quét mã QR nhận ảnh tức thì và bảo mật doanh nghiệp nhiều tầng.

---

## 2. KIẾN TRÚC KỸ THUẬT 3 TẦNG & CÔNG NGHỆ

Hệ thống được phân tách độc lập hoàn toàn giữa **Frontend** và **Backend**:

```
[ Khách Hàng / Tablet / Kiosk ] 
               │ (Port 80)
               ▼
      [ NGINX REVERSE PROXY ]
        ├───► [ FRONTEND (Next.js 14) ] : Port 3000
        └───► [ BACKEND (Express API) ] : Port 5000
                    │
            ┌───────┴───────┐
            │ 3-TIER CORE   │
            ├───────────────┤
            │ 1. Controller │ (Điều hướng, Auth Middleware, Magic Bytes)
            │ 2. Service    │ (Nghiệp vụ ảnh, Canva Proxy, 24h Cleanup)
            │ 3. Repository │ (Quản lý File I/O, Session Isolation, JSON DB)
            └───────┬───────┘
                    ▼
          [ STORAGE / STORAGE DISK ]
          (photos/ • templates/ • data/)
```

- **Frontend**: Next.js 14 (App Router), React 18, CSS Custom Tokens (Dark Luxury Aesthetic).
- **Backend API**: Express.js kiến trúc 3 Tầng (Controller - Service - Repository).
- **Cơ chế lưu trữ**: Private Session Isolation (UUID v4), xóa sạch sau 24h tự động.
- **Gateway**: Nginx Alpine Reverse Proxy, cân bằng tải, nén Gzip, đệm tệp tĩnh.
- **Đóng gói**: Docker Compose tiêu chuẩn.

---

## 3. BẢNG TỔNG HỢP CHỨC NĂNG (FEATURE MATRIX)

| STT | Phân Hệ | Tên Chức Năng | Chi Tiết Kỹ Thuật & Trải Nghiệm |
| :---: | :--- | :--- | :--- |
| **1** | **Kiosk Studio** | **Camera Viewfinder Trực Tiếp** | Hiển thị luồng video độ trễ cực thấp (<50ms), tỷ lệ chuẩn 4:3 và 3:4. |
| **2** | Kiosk Studio | **Bộ Chuyển Đổi Camera (Device Switcher)** | Đổi trực tiếp giữa Webcam tích hợp, máy ảnh DSLR/Mirrorless qua OBS Virtual Camera hoặc camera trước/sau trên tablet. |
| **3** | Kiosk Studio | **Studio Ảo (Virtual Studio Mode)** | Tự động kích hoạt khi môi trường không có webcam vật lý, mô phỏng đầy đủ luồng chụp để kiểm thử không bị gián đoạn. |
| **4** | Kiosk Studio | **Nút Chụp Cố Định (Sticky Shutter Bar)** | Cần bấm chụp luôn ghim cố định ở đáy màn hình (Z-index cao), chạm 1 chạm trên mọi màn hình cảm ứng mà không cần cuộn trang. |
| **5** | Kiosk Studio | **Bộ Đếm Ngược & Hiệu Ứng Flash** | Đếm ngược nhịp 3s - 5s có âm thanh cơ khí Leica/Hasselblad và chớp sáng flash toàn màn hình. |
| **6** | Kiosk Studio | **Chụp Liên Tiếp 8 Tấm (8-Shot Rail)** | Chụp chuỗi 8 tấm tạo dáng, hiển thị thanh ray ảnh thu nhỏ trực quan. |
| **7** | Kiosk Studio | **Chụp Lại Từng Tấm (Single Retake)** | Cho phép chọn chụp lại đúng 1 tấm ưng ý trong 8 tấm mà không phải chụp lại từ đầu cả phiên. |
| **8** | Kiosk Studio | **50+ Bộ Lọc Phim Analog** | Màu Kodak Gold 200, CineStill 800T, Fuji Pro 400H, Portra 400, Trắng đen tương phản cao, Mịn da phong cách Hàn Quốc. |
| **9** | Kiosk Studio | **Khung Mẫu Đa Dạng & Canva** | Khung dải 4 ô dọc kinh điển, 3 ô, 2 ô, lưới 6 ô và hỗ trợ nạp khung đồ họa trực tiếp từ Canva. |
| **10** | Kiosk Studio | **Render 300 DPI Siêu Nét** | Tổng hợp ảnh in độ phân giải cao 300 DPI chuẩn in ấn máy in nhiệt DNP DS-RX1HS, Citizen, Canon Selphy. |
| **11** | Kiosk Studio | **Xuất GIF Boomerang / Timelapse** | Tự động biên dịch video ảnh động GIF tốc độ cao ghi lại các khoảnh khắc tạo dáng. |
| **12** | Kiosk Studio | **Mã QR Động Nhận Ảnh** | Mã QR vector tạo tự động theo phiên chụp để khách quét điện thoại nhận file tức thì. |
| **13** | Kiosk Studio | **Hộp Thoại In Ảnh (Print Modal)** | Lệnh in trực tiếp trình duyệt với bố cục căn chỉnh sẵn 2 dải 2x6" trên khổ giấy 4x6". |
| **14** | **Admin Dashboard** | **Đăng Nhập Khóa Bí Mật** | Bảo mật xác thực qua `Admin Secret Key` (hoặc header `X-Admin-Key`). |
| **15** | Admin Dashboard | **Giám Sát Dung Lượng Ổ Đĩa** | Đo lường dung lượng ảnh lưu trữ theo MB, cảnh báo ngưỡng dung lượng. |
| **16** | Admin Dashboard | **Giám Sát Bộ Nhớ & Uptime** | Đo lường mức RAM tiêu thụ của Node.js process và thời gian máy chủ vận hành liên tục. |
| **17** | Admin Dashboard | **Thống Kê Phiên & File Ảnh** | Báo cáo tổng số lượt khách chụp và tổng số tệp ảnh tồn tại trong hệ thống. |
| **18** | Admin Dashboard | **Quản Trị Khung Mẫu Canva** | Thêm mới template, gán Canva Design ID, chọn số khung hình, đổi hướng ngang/dọc, bật/tắt hoặc xóa mẫu. |
| **19** | Admin Dashboard | **Quản Trị Bộ Lọc Màu** | Bật hoặc tắt linh hoạt từng bộ lọc màu theo thị hiếu hoặc mùa sự kiện. |
| **20** | Admin Dashboard | **Dọn Dẹp Dung Lượng Tức Thì** | Nút bấm giải phóng dung lượng thủ công lập tức dọn các phiên hết hạn (>24h). |
| **21** | **Mobile Download** | **Trang Nhận Ảnh Khách Hàng** | Giao diện tối ưu mobile tải ảnh 1 chạm (Tải PNG 300 DPI, Xem trước). |
| **22** | **Backend 3 Tầng** | **Magic Bytes Binary Security** | Quét 8 bytes đầu tiên của file nhị phân, loại trừ 100% tệp tin độc hại giả mạo đuôi ảnh. |
| **23** | Backend 3 Tầng | **Phân Lập Thư Mục Phiên Chụp** | Mỗi phiên mang mã UUID v4 riêng biệt, khách phiên này không thể xem ảnh phiên khác. |
| **24** | Backend 3 Tầng | **Dọn Dẹp Tự Động Định Kỳ 24h** | Worker nền quét định kỳ mỗi 30 phút xóa sạch ảnh quá 24h bảo vệ quyền riêng tư khách hàng. |
| **25** | **Hạ Tầng** | **Docker & Nginx Reverse Proxy** | Điều phối tự động bằng `docker-compose.yml`, tích hợp cổng 80, 3000, 5000. |

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### Cách 1: Khởi Chạy Bằng Docker Compose (Khuyên Dùng Cho Production & Kiosk)
Yêu cầu: Đã cài đặt **Docker** và **Docker Compose**.
```bash
# 1. Chuyển vào thư mục dự án
cd c:\memay\online-photobooth

# 2. Khởi chạy toàn bộ hệ thống (Frontend + Backend + Nginx)
docker compose up -d --build
```
Sau khi khởi chạy:
- **Kiosk Studio**: `http://localhost:3000/studio` (hoặc `http://localhost/studio`)
- **Bảng Quản Trị Admin**: `http://localhost:3000/admin` (Mã truy cập mặc định: `zumppi_photobooth_secure_key_2026`)
- **Trang Nhận Ảnh Mobile**: `http://localhost:3000/download`
- **Backend API**: `http://localhost:5000/api/v1`

Để dừng hệ thống:
```bash
docker compose down
```

---

### Cách 2: Khởi Chạy Cục Bộ Thủ Công (Dành Cho Lập Trình Viên)
Yêu cầu: Đã cài đặt **Node.js 18+**.

**Khởi chạy Backend (Port 5000):**
```bash
cd c:\memay\online-photobooth\backend
npm install
npm start
```

**Khởi chạy Frontend Next.js (Port 3000):**
```bash
cd c:\memay\online-photobooth\frontend
npm install
npm run dev
```

---

### Cách 3: Chạy Bộ Kiểm Thử Nhanh (Native Unit Tests)
Hệ thống tích hợp sẵn bộ kiểm thử bảo mật và 3 tầng không phụ thuộc thư viện ngoài:
```bash
node tests/unit/core.test.js
```
Kết quả hiển thị: `8 Passed, 0 Failed (100% Pass)`.

---

## 5. HƯỚNG DẪN THAO TÁC CHI TIẾT

### 5.1. Dành Cho Khách Hàng (Kiosk Studio `/studio`)

```
[BƯỚC 1: Chọn Khung] ➔ [BƯỚC 2: Chọn Màu Phim] ➔ [BƯỚC 3: Tạo Dáng & Bấm Chụp] ➔ [BƯỚC 4: Xuất Ảnh & Quét QR]
```

1. **Chọn Khung Mẫu & Số Ô Ảnh**:
   - Khách hàng chạm chọn mẫu dải ảnh yêu thích tại thanh chọn khung (Dải 4 ô dọc Classic, Lưới 6 ô, Phong cách Y2K, v.v.).
2. **Chọn Màu Phim Analog**:
   - Chọn bộ lọc màu yêu thích: *Kodak Gold 200* (ấm áp cổ điển), *CineStill 800T* (ánh đèn đêm điện ảnh), *Fuji Pro 400H* (trong trẻo mát mắt), hoặc *B&W* (đen trắng nghệ thuật).
3. **Chuyển Đổi Camera (Nếu Cần)**:
   - Trên thanh công cụ trên cùng, nhấn vào danh sách Camera để chuyển sang Webcam ngoài độ phân giải cao hoặc máy ảnh chuyên nghiệp.
4. **Bấm Chụp Ảnh (Sticky Shutter)**:
   - Nhấn vào nút chụp tròn **`📸 BẤM ĐÂY ĐỂ CHỤP`** luôn hiển thị nổi cố định ở đáy màn hình.
   - Màn hình sẽ đếm ngược 3 giây kèm tiếng bíp và hiệu ứng flash chụp liên tiếp 8 lượt tạo dáng.
5. **Chụp Lại (Retake)**:
   - Nếu có tấm ảnh nào bị nhắm mắt hoặc chưa ưng ý, khách chỉ cần chạm vào tấm ảnh đó trên thanh ray và bấm **"Chụp lại ảnh này"**.
6. **Nhận Ảnh & In Tức Thì**:
   - Nhấn **"Hoàn Tất & Xem Ảnh In"**.
   - Màn hình hiển thị ảnh ghép hoàn chỉnh 300 DPI kèm **Mã QR**.
   - Khách dùng điện thoại quét mã QR để tải ảnh về máy.
   - Nhấn **"In Nhiệt Ngay"** để xuất lệnh ra máy in Kiosk.

---

### 5.2. Dành Cho Quản Trị Viên (Admin Dashboard `/admin`)

1. **Đăng Nhập Quản Trị**:
   - Truy cập `http://localhost:3000/admin`.
   - Nhập **Admin Secret Key** (mặc định: `zumppi_photobooth_secure_key_2026`).
2. **Xem Báo Cáo Thống Kê**:
   - **Dung lượng ảnh lưu trữ (MB)**: Theo dõi bộ nhớ thực tế đang dùng.
   - **RAM Node.js & Uptime**: Đảm bảo máy chủ ổn định không bị rò rỉ bộ nhớ.
   - **Tổng Session & File Ảnh**: Thống kê số lượt phục vụ trong ngày.
3. **Quản Lý Mẫu Khung (Templates)**:
   - Chuyển sang tab **"KHUNG MẪU TEMPLATE"**.
   - Nhập tên mẫu, số khung hình (2, 3, 4, 6 ô), mã `Canva Design ID` rồi bấm **"Lưu Khung Mẫu"**.
   - Có thể xóa hoặc tạm tắt mẫu khung cũ khi hết mùa lễ hội.
4. **Quản Lý Bộ Lọc Màu (Filters)**:
   - Chuyển sang tab **"BỘ LỌC MÀU FILTER"**.
   - Nhấn nút **"ĐANG BẬT / ĐANG TẮT"** để kích hoạt hoặc ẩn bộ lọc tương ứng trên Kiosk.
5. **Dọn Dẹp Dung Lượng Khẩn Cấp**:
   - Nhấn nút **`🧹 Dọn Dẹp Dung Lượng`** ở góc phải thanh tiêu đề để lập tức quét và giải phóng các session chụp quá 24h.

---

### 5.3. Dành Cho Khách Quét Mã Tải Ảnh (`/download`)

1. Khách dùng camera điện thoại (iOS / Android) quét mã QR trên màn hình Kiosk.
2. Trình duyệt điện thoại tự động mở trang web có dạng:
   `http://<IP_HOAC_TEN_MIEN>/download?sessionId=...&fileId=...`
3. Ảnh dải chụp 300 DPI hiển thị sắc nét trên màn hình điện thoại.
4. Khách chỉ cần chạm vào nút **`⬇ Tải Ảnh Gốc (300 DPI)`** để lưu trực tiếp vào thư viện ảnh của điện thoại.

---

## 6. CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)

Hệ thống cung cấp các biến môi trường mẫu trong file `.env.example`:

### Cấu Hình Chung Cho Docker Compose (`.env` tại thư mục gốc):
```env
BACKEND_PORT=5000
FRONTEND_PORT=3000
NGINX_PORT=80
ADMIN_SECRET_KEY=zumppi_photobooth_secure_key_2026
SESSION_RETENTION_HOURS=24
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
CANVA_API_KEY=
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=
```

### Cấu Hình Riêng Cho Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=production
ADMIN_SECRET_KEY=zumppi_photobooth_secure_key_2026
SESSION_RETENTION_HOURS=24
CANVA_API_KEY=
```

### Cấu Hình Riêng Cho Frontend (`frontend/.env.local`):
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 7. BẢO MẬT & TỐI ƯU HÓA DUNG LƯỢNG

1. **Bảo Mật Chữ Ký Nhị Phân Magic Bytes**:
   - Mọi tệp ảnh gửi lên máy chủ đều được hàm `validateMagicBytes()` thẩm định trực tiếp qua 8 byte đầu (ví dụ PNG: `89 50 4E 47 0D 0A 1A 0A`, JPEG: `FF D8 FF`). Nếu phát hiện mã độc (như file `.php`, `.sh`, đoạn script XSS) giả dạng đuôi `.png`, hệ thống lập tức từ chối với mã lỗi `400 Bad Request`.
2. **Cô Lập Phiên Chụp (Tenant Session Isolation)**:
   - Ảnh của từng lượt khách được lưu trữ riêng trong thư mục định danh bằng `UUID v4` ngẫu nhiên bảo mật (ví dụ: `storage/photos/8f92b7c0-42f1-4cf5-99e2-d4ec18b84920/`). Không ai có thể dò đoán hay truy cập trái phép ảnh của người khác.
3. **Giải Phóng Bộ Nhớ Định Kỳ (24h Retention Cleanup)**:
   - Định kỳ mỗi 30 phút, tiến trình nền tự động quét thư mục `storage/photos/`. Mọi thư mục phiên có thời gian khởi tạo vượt quá `SESSION_RETENTION_HOURS` (mặc định 24 giờ) sẽ tự động bị xóa vĩnh viễn khỏi máy chủ, giúp dung lượng ổ cứng không bao giờ bị tràn.
4. **Bảo Mật Token Canva**:
   - Khóa bí mật API của Canva được lưu trữ hoàn toàn ở Backend và proxy qua API nội bộ. Mã nguồn Frontend không bao giờ chứa thông tin đăng nhập Canva.

---

## 8. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

| Hiện Tượng | Nguyên Nhân | Cách Xử Lý Khắc Phục |
| :--- | :--- | :--- |
| **Báo lỗi Backend OFFLINE trên trang chủ** | Backend chưa được bật hoặc bị chặn tường lửa. | Chạy lệnh `docker compose up -d` hoặc mở terminal chạy `cd backend && npm start`. Kiểm tra port 5000 có bị chiếm không. |
| **Màn hình camera bị đen hoặc báo "Không tìm thấy webcam"** | Trình duyệt chưa cấp quyền camera hoặc máy không có webcam. | 1. Bấm vào biểu tượng ổ khóa cạnh thanh địa chỉ duyệt web ➔ Bật **Cho phép Camera**.<br>2. Nếu dùng máy tính bàn không webcam, hệ thống sẽ tự động bật **Studio Ảo (Virtual Studio)** để bạn tiếp tục thử nghiệm. |
| **Lỗi xung đột Port (Port 3000 hoặc 5000 đã dùng)** | Ứng dụng khác đang chạy trên cùng port. | Chỉnh sửa file `.env`: đổi `BACKEND_PORT=5001`, `FRONTEND_PORT=3001` và khởi động lại. |
| **Quét mã QR trên điện thoại không tải được ảnh** | Mã QR đang trỏ tới `localhost` thay vì địa chỉ IP LAN của máy chủ Kiosk. | Trong file `.env`, đổi `NEXT_PUBLIC_API_URL` từ `http://localhost:5000/api/v1` thành IP mạng cục bộ (ví dụ: `http://192.168.1.100:5000/api/v1`). |
| **Không đăng nhập được vào Admin** | Nhập sai Admin Secret Key. | Khóa mặc định là `zumppi_photobooth_secure_key_2026`. Bạn có thể tra cứu hoặc đổi mã này trong file `backend/.env`. |

---

## 📜 THÔNG TIN PHÁT TRIỂN & BẢN QUYỀN
Hệ thống được phát triển theo tiêu chuẩn Enterprise Photobooth Software — **Zump.pi Production**.
Mọi thắc mắc kỹ thuật vui lòng kiểm tra tài liệu kiến trúc tại thư mục [`docs/`](file:///c:/memay/online-photobooth/docs/) hoặc chạy bộ kiểm thử tự động.
