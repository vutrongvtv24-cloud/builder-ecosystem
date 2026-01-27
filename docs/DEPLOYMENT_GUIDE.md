# 🚀 Hướng Dẫn Deploy & Vận Hành Trên VPS (aaPanel)

**Ngày cập nhật:** 2026-01-27
**Server IP:** 43.228.214.174
**Domain:** tulanh.online

---

## 1. Kiến trúc Deployment
Hệ thống sử dụng mô hình **Reverse Proxy**:
- **App:** Next.js chạy trên port `3000` (quản lý bởi PM2)
- **Web Server:** Nginx (aaPanel) nhận request từ port `80/443`
- **Proxy:** Nginx chuyển tiếp request vào `localhost:3000`

---

## 2. Cách Update Code Mới
Mỗi khi bạn đẩy code lên GitHub (`git push`), hãy vào VPS và chạy lệnh tắt sau:

```bash
update-web
```

**Script `update-web` sẽ tự động thực hiện:**
1. `git pull` (Lấy code mới)
2. `npm install` (Cài thư viện nếu có mới)
3. `npm run build` (Build lại Next.js)
4. `pm2 restart tulanh` (Khởi động lại app)

---

## 3. Các Lệnh Quản Trị Thường Dùng

### Xem Log (Kiểm tra lỗi)
```bash
pm2 logs tulanh
```

### Khởi động lại App thủ công
```bash
pm2 restart tulanh
```

### Dừng App
```bash
pm2 stop tulanh
```

### Kiểm tra trạng thái
```bash
pm2 status
```
hoặc
```bash
pm2 monit
```

---

## 4. Xử Lý Sự Cố (Troubleshooting)

### Lỗi 502 Bad Gateway
- **Nguyên nhân:** App chưa chạy hoặc đang khởi động lại.
- **Cách sửa:** Chạy `pm2 status` xem `tulanh` có "online" không. Nếu "errored", xem `pm2 logs`.

### Lỗi SSL / Không vào được HTTPS
- **Nguyên nhân:** Chứng chỉ hết hạn hoặc chưa bật Force HTTPS.
- **Cách sửa:** Vào aaPanel -> Website -> tulanh.online -> SSL -> Let's Encrypt -> Renew hoặc Apply lại.

### Lỗi "Address already in use" (Không bật được Nginx)
- **Nguyên nhân:** Xung đột cổng 80 với Apache hoặc tiến trình Nginx treo.
- **Cách sửa:**
  ```bash
  pkill -9 nginx
  /etc/init.d/nginx start
  ```
