# IT Support Portal - Tài liệu cài đặt và tài khoản demo

Tài liệu này dành cho người mua source hoặc người cần chạy project trên máy cá nhân.

## 1. Nếu chỉ muốn xem demo

Không cần cài đặt.

Live Demo:

https://it-support-portal-snowy.vercel.app

Tài khoản demo:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Technical Lead | `lead@itsupport.local` | `123456` |
| Technician | `technician@itsupport.local` | `123456` |
| User | `user@itsupport.local` | `123456` |

Ba tài khoản trên dùng để kiểm tra các mức phân quyền khác nhau.

## 2. Yêu cầu môi trường

Máy chạy source cần:

- Windows, macOS hoặc Linux
- Node.js 20 trở lên
- npm
- MySQL 8 trở lên
- VS Code hoặc IDE tương đương
- VS Code Live Server hoặc static web server

Kiểm tra Node.js:

```bash
node -v
npm -v
```

## 3. Cài đặt source

Nếu nhận source dạng ZIP:

1. Giải nén source.
2. Mở Terminal tại thư mục project.
3. Cài dependency:

```bash
npm install
```

## 4. Cấu hình database

Copy file:

```text
.env.example
```

thành:

```text
.env
```

Sau đó điền thông tin MySQL của người sử dụng.

Ví dụ:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://127.0.0.1:5500

DATA_SOURCE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=it_support_portal
DB_SSL=false
DB_CONNECTION_LIMIT=4

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
```

Không sử dụng lại credential production của bản demo. Không commit file `.env`.

## 5. Khởi tạo database

Chạy lần lượt:

```bash
npm run db:ping
npm run db:migrate
npm run db:seed
```

Ý nghĩa:

- `db:ping`: kiểm tra kết nối MySQL.
- `db:migrate`: tạo/cập nhật cấu trúc database.
- `db:seed`: tạo dữ liệu mẫu và tài khoản demo.

Nếu `db:ping` báo lỗi, kiểm tra lại MySQL đang chạy và các thông tin `DB_*` trong `.env`.

## 6. Chạy backend

Khởi động API:

```bash
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:3000
```

API:

```text
http://localhost:3000/api/v1
```

Kiểm tra nhanh:

```text
http://localhost:3000/api/v1/health
```

## 7. Chạy frontend

Mở thư mục project bằng VS Code.

Dùng Live Server để mở:

```text
index.html
```

Frontend thường chạy tại:

```text
http://127.0.0.1:5500
```

Source ZIP được đóng gói để sử dụng backend local `http://localhost:3000/api/v1`.

Nếu người dùng thay đổi port backend hoặc chạy backend trên host khác, cần chỉnh API base URL trong frontend trước khi chạy.

## 8. Đăng nhập kiểm tra

### Technical Lead

```text
Email: lead@itsupport.local
Password: 123456
```

Có quyền quản lý đầy đủ các module và ticket.

### Technician

```text
Email: technician@itsupport.local
Password: 123456
```

Dùng để kiểm tra ticket được phân công, thiết bị, network và workflow xử lý.

### User

```text
Email: user@itsupport.local
Password: 123456
```

Dùng để kiểm tra quyền người dùng cuối và phạm vi ticket của chính mình.

## 9. Kiểm tra project

Sau khi backend và database chạy:

```bash
npm run check:server
npm run test:api
```

Kết quả mong đợi:

- Server syntax check: PASS
- API/security smoke test: PASS
- Database ping: PASS

Có thể mở:

```text
tests/regression.html
```

để kiểm tra frontend.

## 10. Một số lỗi thường gặp

### Không kết nối được MySQL

Kiểm tra:

- MySQL service đã chạy chưa.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Database đã được tạo chưa.
- Nếu dùng MySQL cloud, kiểm tra SSL/CA theo yêu cầu của nhà cung cấp.

### Frontend không gọi được API

Kiểm tra:

- Backend có đang chạy ở port 3000 không.
- Mở `/api/v1/health` có trả `ok: true) không.
- `CORS_ORIGIN` trong `.env` có đúng URL frontend không.
- Frontend đang trỏ đúng API base URL chưa.

### Đăng nhập không được sau khi cài mới

Chạy lại:

```bash
npm run db:migrate
npm run db:seed
```

Sau đó thử lại tài khoản demo.

## 11. Lưu ý khi dùng thực tế

Tài khoản trên chỉ dành cho demo.

Nếu triển khai thành hệ thống thật:

- Đổi toàn bộ mật khẩu demo.
- Tạo JWT secret mới.
- Dùng database riêng.
- Không đưa `.env` lên GitHub.
- Không chia sẻ database password.
- Cấu hình CORS theo domain frontend thực tế.
- Bật SSL khi database provider yêu cầu.

## 12. Source và demo

Source code:

https://drive.google.com/file/d/1HKiFwyjllYrbOaBsjEPZRKcvyBdwQOL0/view?usp=sharing

Live Demo:

https://it-support-portal-snowy.vercel.app

GitHub project:

https://github.com/LePhamNhatLe/it-support-portal
