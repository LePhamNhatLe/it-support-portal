# Backend API - P21

Base URL mặc định: `http://localhost:3000/api/v1`

## Khởi động

```bash
npm install
npm run dev
```

Sao chép `.env.example` thành `.env` nếu cần đổi port hoặc CORS origin.

## Chuẩn response

Thành công:

```json
{
  "ok": true,
  "data": {}
}
```

Lỗi:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": []
  }
}
```

## Endpoints

### Health
- `GET /health`

### Tickets
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`

### Devices
- `GET /devices`
- `GET /devices/:id`
- `POST /devices`
- `PATCH /devices/:id`
- `DELETE /devices/:id`

### Users
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Network
- `GET /network`
- `GET /network/:id`
- `POST /network`
- `PATCH /network/:id`
- `DELETE /network/:id`

### Settings
- `GET /settings`
- `PATCH /settings`

### Reports
- `GET /reports/summary`

## Kiến trúc P21

P21 dùng repository in-memory để tách API layer khỏi cơ sở dữ liệu. P22 sẽ thay lớp `memory-store` bằng MySQL repository mà không cần đổi contract API chính.

Backend authentication chưa được triển khai ở P21. Phần JWT/session, password hashing, authorization middleware và security hardening được dành cho P24 theo roadmap.
