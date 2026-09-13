# 🎥 HƯỚNG DẪN THIẾT LẬP CAMERA & PHẦN CỨNG BUỒNG CHỤP (KIOSK HARDWARE SETUP)

## 1. THIẾT BỊ HỖ TRỢ

Hệ thống Buồng Chụp Ảnh Kiosk hỗ trợ 3 loại nguồn ghi hình chính:
1. **Máy ảnh DSLR / Mirrorless (Canon, Sony, Nikon, Fujifilm)**: Kết nối qua cáp USB thông qua phần mềm giả lập Webcam (Canon EOS Webcam Utility, Sony Imaging Edge Webcam, SparkoCam).
2. **Webcam USB Chuyên Dụng (4K / 1080p 60fps)**: Logitech Brio 4K, Logitech C922 Pro, Razer Kiyo Pro, Elgato Facecam.
3. **Capture Card HDMI**: Elgato Cam Link 4K, AverMedia Live Gamer MINI (kết nối trực tiếp từ cổng HDMI Clean Feed của máy ảnh).

---

## 2. THIẾT LẬP MÁY ẢNH CHUẨN KIOSK

### 2.1 Cài Đặt Thông Số Phơi Sáng (Manual Mode - M)
- **Tốc độ màn trập (Shutter Speed)**: `1/125s` - `1/160s` (tránh nhòe khi khách hàng chuyển động tạo dáng).
- **Khẩu độ (Aperture)**: `f/4.0` - `f/5.6` (đảm bảo cả nhóm bạn 2-4 người đều nằm trong vùng nét).
- **Độ nhạy sáng (ISO)**: `ISO 200` - `ISO 400` (giữ chi tiết trong trẻo, không bị nhiễu hạt kỹ thuật số).
- **Cân bằng trắng (White Balance)**: Cố định theo nguồn sáng buồng (ví dụ: `5500K` cho đèn Daylight).
- **Chế độ lấy nét (Focus Mode)**: `AF-C` (Continuous AF) kèm nhận diện khuôn mặt/mắt (Eye AF).

### 2.2 Đèn Flash & Ánh Sáng Buồng Chụp
- Đặt 2 đèn Softbox khuếch tán ánh sáng ở góc 45 độ đối xứng hai bên.
- Đặt 1 đèn Ring Light hoặc đèn hắt sáng bổ trợ phía dưới cằm để triệt tiêu bóng tối dưới mắt.

---

## 3. THIẾT LẬP TRÌNH DUYỆT KIOSK TỰ ĐỘNG

### 3.1 Khởi Động Chrome ở Chế Độ Kiosk Toàn Màn Hình
Tạo shortcut khởi động Kiosk trên Windows với các tham số:
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --use-fake-ui-for-media-stream --disable-pinch --overscroll-history-navigation=0 "http://localhost:3000/selfbooth.html"
```

**Giải thích tham số:**
- `--kiosk`: Mở toàn màn hình, khóa phím thoát F11 và thanh địa chỉ URL.
- `--use-fake-ui-for-media-stream`: Tự động cấp quyền truy cập Camera/Microphone mà không hiện popup hỏi quyền của trình duyệt.
- `--disable-pinch`: Vô hiệu hóa tính năng zoom bằng 2 ngón tay trên màn hình cảm ứng Kiosk.
- `--overscroll-history-navigation=0`: Ngăn chặn cử chỉ vuốt ngang làm lùi trang (Back/Forward navigation).

---

## 4. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### Sự cố 1: Camera bị đen hoặc không nhận diện
- **Nguyên nhân**: Quyền camera bị chặn hoặc thiết bị đang bị chiếm dụng bởi phần mềm khác (OBS, Zoom, v.v.).
- **Khắc phục**:
  1. Tắt các ứng dụng chạy nền đang sử dụng camera.
  2. Mở `Settings` ➔ `Privacy & Security` ➔ `Camera` trong Windows và bật `Allow desktop apps to access your camera`.
  3. Hệ thống Photobooth sẽ tự động kích hoạt **Studio Demo Mode** với nhân vật chuyển động để khách không bao giờ thấy màn hình đen.

### Sự cố 2: Tốc độ tráng phim chậm
- **Nguyên nhân**: Độ phân giải canvas 300 DPI quá lớn trên máy tính cấu hình thấp.
- **Khắc phục**: Đảm bảo GPU Hardware Acceleration đã được bật trong trình duyệt (`chrome://settings/system` ➔ `Use hardware acceleration when available`).
