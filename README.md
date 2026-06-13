# 🧺 LnD clozet — Unique. Cozy. You.

Website bán hàng phong cách **retro ấm áp** cho shop đồ bộ tole lạnh **LnD clozet**, gồm 3 phân loại:

- **Đồ bộ nam**
- **Đồ bộ nữ**
- **Quần đùi nữ**

## Tính năng

- Xem các mặt hàng theo từng phân loại
- Chọn màu sắc trực quan (giống Shopee) — đổi màu sẽ đổi luôn ảnh minh hoạ
- Chọn size, số lượng, thêm vào giỏ hàng
- **Tìm kiếm** sản phẩm theo tên và **sắp xếp theo giá** (thấp→cao, cao→thấp) hoặc theo tên
- **Phí vận chuyển** tự động (miễn phí khi đơn đạt mốc) và **mã giảm giá**
- Giỏ hàng tự lưu (không mất khi tải lại trang)
- Bấm **Đặt hàng** → hệ thống **gửi email đơn hàng về cho bạn**

## Phí ship & mã giảm giá

Cấu hình trong `products.js`:

- **Phí ship:** mặc định `30.000đ`, **miễn phí** khi đơn từ `300.000đ` (sửa ở `export const shipping`).
- **Mã giảm giá** có sẵn (sửa ở `export const discounts`):
  - `MUAHE10` – giảm 10% toàn đơn
  - `GIAM20K` – giảm 20.000đ
  - `FREESHIP` – miễn phí vận chuyển

> Tiền luôn được **tính lại ở máy chủ** khi đặt hàng nên khách không thể chỉnh sửa giá từ trình duyệt.

## 1. Cài đặt

Cần cài [Node.js](https://nodejs.org) (phiên bản 18 trở lên). Sau đó mở terminal trong thư mục dự án và chạy:

```bash
npm install
```

## 2. Cấu hình nhận đơn hàng qua Discord (khuyên dùng)

Khi khách bấm **Đặt hàng**, hệ thống sẽ bắn thông báo đơn hàng vào kênh Discord của bạn.

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Lấy **Webhook URL** của Discord:

1. Mở Discord (máy tính), vào **Server** của bạn.
2. **Server Settings → Integrations → Webhooks → New Webhook**.
3. Chọn kênh muốn nhận đơn → **Copy Webhook URL**.
4. Dán vào `.env`:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/....
```

> Nếu chưa cấu hình kênh nào, website vẫn chạy bình thường và đơn hàng được lưu vào `orders.log` để xem sau.

### (Tuỳ chọn) Gửi thêm qua email

Nếu muốn nhận thêm qua Gmail: bật 2-Step Verification, tạo **App Password** tại
https://myaccount.google.com/apppasswords rồi điền `SMTP_USER`, `SMTP_PASS`, `ORDER_EMAIL_TO` trong `.env`.

## 3. Chạy website

```bash
npm start
```

Mở trình duyệt: **http://localhost:3000**

## Sản phẩm & hình ảnh

- Ảnh sản phẩm thật nằm trong `public/images/`. Mỗi sản phẩm trỏ tới một ảnh qua trường `image`.
- Sản phẩm nhiều mẫu (ví dụ **Quần Đùi Siêu Mát**) dùng `variants` — chọn mẫu sẽ đổi ảnh hiển thị giống Shopee.
- Giá hiện tại: Đồ bộ nữ **159k**, Đồ bộ nam **189k**, Quần đùi nữ **50k** (sửa ở biến `GIA` trong `products.js`).
- Khu "Review từ shop" lấy ảnh từ mảng `gallery` trong `products.js`.

Để thêm sản phẩm: copy ảnh vào `public/images/`, rồi thêm một mục vào mảng `products` trong `products.js`.

## Cấu trúc dự án

```
.
├── server.js          # Server Express + gửi email
├── products.js        # Danh sách sản phẩm & phân loại
├── public/
│   ├── index.html     # Giao diện
│   ├── styles.css     # Style
│   └── app.js         # Logic: xem hàng, chọn màu, giỏ hàng, đặt hàng
├── .env.example       # Mẫu cấu hình email
└── README.md
```
