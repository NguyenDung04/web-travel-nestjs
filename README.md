# BE Web Travel

Backend API cho hệ thống quản lý website du lịch, khách sạn, đặt phòng, bài viết và nội dung truyền thông.

Dự án cung cấp các API phục vụ các nghiệp vụ chính như đăng nhập, quản lý người dùng, vai trò, khách hàng, khách sạn, loại phòng, tồn kho phòng, booking, media, bài viết, slider và cấu hình hệ thống. API sử dụng cơ chế xác thực bằng JWT Bearer Token, hỗ trợ phân trang, validate dữ liệu, xóa mềm, khôi phục và xóa vĩnh viễn dữ liệu.

---

## 1. Tổng quan chức năng

Hệ thống backend bao gồm các nhóm chức năng chính:

| Nhóm chức năng    | Mô tả                                          |
| ----------------- | ---------------------------------------------- |
| Auth              | Đăng nhập, lấy thông tin cá nhân, đổi mật khẩu |
| Users             | Quản lý tài khoản người dùng                   |
| Roles             | Quản lý vai trò và phân quyền                  |
| Customers         | Quản lý thông tin khách hàng                   |
| Hotels            | Quản lý khách sạn                              |
| Room Types        | Quản lý loại phòng của khách sạn               |
| Room Inventory    | Quản lý tồn kho phòng theo ngày                |
| Bookings          | Quản lý đặt phòng                              |
| Categories        | Quản lý danh mục                               |
| Media             | Quản lý hình ảnh/file media                    |
| Hotel Room Images | Quản lý hình ảnh khách sạn/phòng               |
| Posts             | Quản lý bài viết, địa điểm, nội dung du lịch   |
| Post Media        | Gắn media vào bài viết                         |
| Sliders           | Quản lý banner/slider trang chủ                |
| Settings          | Quản lý cấu hình hệ thống                      |

---

## 2. Công nghệ sử dụng

Dự án backend phù hợp với stack sau:

| Thành phần     | Công nghệ đề xuất     |
| -------------- | --------------------- |
| Runtime        | Node.js               |
| Framework      | NestJS                |
| Language       | TypeScript            |
| Database       | MySQL / PostgreSQL    |
| ORM            | TypeORM               |
| Authentication | JWT Bearer Token      |
| Validation     | DTO + Validation Pipe |
| Upload         | Multipart/Form-data   |
| API Style      | RESTful API           |

> Lưu ý: Nếu dự án thực tế của bạn dùng tên package, database hoặc ORM khác, hãy sửa lại phần này theo mã nguồn hiện tại.

---

## 3. Cài đặt dự án

### 3.1. Clone source code

```bash
git clone <repository-url>
cd <project-folder>
```

### 3.2. Cài thư viện

```bash
npm install
```

### 3.3. Tạo file môi trường

Tạo file `.env` ở thư mục gốc dự án:

```env
APP_PORT=3000
APP_NAME=BE_WEB_TRAVEL

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=web_travel

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

UPLOAD_PATH=uploads
MEDIA_AUTO_MIRROR=false
UPLOAD_IMAGE_MAX_BYTES=5242880
```

### 3.4. Chạy migration/database

Tùy cấu hình dự án, sử dụng một trong các lệnh sau:

```bash
npm run migration:run
```

Hoặc nếu đang phát triển và có bật synchronize:

```bash
npm run start:dev
```

### 3.5. Chạy server development

```bash
npm run start:dev
```

Server mặc định:

```txt
http://localhost:3000
```

---

## 4. Xác thực API

Các API quản trị cần gửi JWT token trong header:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

Đăng nhập thành công sẽ trả về `accessToken`.

Ví dụ:

```json
{
    "message": "Đăng nhập thành công",
    "data": {
        "accessToken": "<JWT>"
    }
}
```

---

## 5. Cấu trúc response chuẩn

### 5.1. Response thành công

```json
{
    "success": true,
    "message": "Thao tác thành công",
    "data": {},
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 100
    }
}
```

### 5.2. Response lỗi

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "name",
            "message": "Tên không hợp lệ"
        }
    ]
}
```

### 5.3. Các mã trạng thái thường gặp

| Status | Ý nghĩa                               |
| ------ | ------------------------------------- |
| 200    | Thành công                            |
| 201    | Tạo mới thành công                    |
| 400    | Dữ liệu không hợp lệ                  |
| 401    | Chưa xác thực hoặc token không hợp lệ |
| 403    | Không có quyền truy cập               |
| 404    | Không tìm thấy dữ liệu                |
| 500    | Lỗi server                            |

---

## 6. Danh sách API chính

### 6.1. Auth

| Method | Endpoint                | Mô tả                            | Auth  |
| ------ | ----------------------- | -------------------------------- | ----- |
| POST   | `/auth/login`           | Đăng nhập bằng username/password | Không |
| GET    | `/auth/profile`         | Lấy thông tin cá nhân            | Có    |
| PATCH  | `/auth/change-password` | Đổi mật khẩu                     | Có    |

Ví dụ đăng nhập:

```json
{
    "username": "ngocanh",
    "password": "Abcd1234"
}
```

---

### 6.2. Booking

| Method | Endpoint                  | Mô tả                                |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/bookings/active`        | Lấy danh sách booking đang hoạt động |
| GET    | `/bookings/deleted`       | Lấy danh sách booking đã xóa mềm     |
| GET    | `/bookings/active/:id`    | Lấy chi tiết booking đang hoạt động  |
| GET    | `/bookings/deleted/:id`   | Lấy chi tiết booking đã xóa mềm      |
| POST   | `/bookings`               | Tạo booking mới                      |
| PATCH  | `/bookings/:id`           | Cập nhật booking                     |
| DELETE | `/bookings/soft/:id`      | Xóa mềm một booking                  |
| DELETE | `/bookings/soft`          | Xóa mềm nhiều booking                |
| POST   | `/bookings/restore/:id`   | Khôi phục một booking                |
| POST   | `/bookings/restore`       | Khôi phục nhiều booking              |
| DELETE | `/bookings/permanent/:id` | Xóa vĩnh viễn booking                |

Body tạo booking:

```json
{
    "booking_code": "BK-20250101-0001",
    "customer_id": 1,
    "hotel_id": 10,
    "room_type_id": 3,
    "checkin_date": "2025-12-20",
    "checkout_date": "2025-12-22",
    "adults": 2,
    "children": 1,
    "total_amount": 350.0,
    "status": "pending"
}
```

---

### 6.3. Categories

| Method | Endpoint                    | Mô tả                             |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/categories/active`        | Danh sách danh mục đang hoạt động |
| GET    | `/categories/deleted`       | Danh sách danh mục đã xóa mềm     |
| GET    | `/categories/active/:id`    | Chi tiết danh mục đang hoạt động  |
| GET    | `/categories/deleted/:id`   | Chi tiết danh mục đã xóa mềm      |
| POST   | `/categories`               | Tạo danh mục                      |
| PATCH  | `/categories/:id`           | Cập nhật danh mục                 |
| DELETE | `/categories/soft/:id`      | Xóa mềm một danh mục              |
| DELETE | `/categories/soft`          | Xóa mềm nhiều danh mục            |
| POST   | `/categories/restore/:id`   | Khôi phục một danh mục            |
| POST   | `/categories/restore`       | Khôi phục nhiều danh mục          |
| DELETE | `/categories/permanent/:id` | Xóa vĩnh viễn danh mục            |

Body tạo danh mục:

```json
{
    "name": "Du lịch mạo hiểm"
}
```

---

### 6.4. Customers

| Method | Endpoint                   | Mô tả                               |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/customers/active`        | Danh sách khách hàng đang hoạt động |
| GET    | `/customers/deleted`       | Danh sách khách hàng đã xóa mềm     |
| GET    | `/customers/active/:id`    | Chi tiết khách hàng đang hoạt động  |
| GET    | `/customers/deleted/:id`   | Chi tiết khách hàng đã xóa mềm      |
| POST   | `/customers`               | Tạo khách hàng                      |
| PATCH  | `/customers/:id`           | Cập nhật khách hàng                 |
| DELETE | `/customers/soft/:id`      | Xóa mềm một khách hàng              |
| DELETE | `/customers/soft`          | Xóa mềm nhiều khách hàng            |
| POST   | `/customers/restore/:id`   | Khôi phục một khách hàng            |
| POST   | `/customers/restore`       | Khôi phục nhiều khách hàng          |
| DELETE | `/customers/permanent/:id` | Xóa vĩnh viễn khách hàng            |

Body tạo khách hàng:

```json
{
    "full_name": "Nguyễn Văn A",
    "email": "a@example.com",
    "phone": "0901234567",
    "note": "VIP"
}
```

---

### 6.5. Hotels

| Method | Endpoint                | Mô tả                              |
| ------ | ----------------------- | ---------------------------------- |
| GET    | `/hotels/active`        | Danh sách khách sạn đang hoạt động |
| GET    | `/hotels/deleted`       | Danh sách khách sạn đã xóa mềm     |
| GET    | `/hotels/active/:id`    | Chi tiết khách sạn đang hoạt động  |
| GET    | `/hotels/deleted/:id`   | Chi tiết khách sạn đã xóa mềm      |
| POST   | `/hotels`               | Tạo khách sạn                      |
| PATCH  | `/hotels/:id`           | Cập nhật khách sạn                 |
| DELETE | `/hotels/soft/:id`      | Xóa mềm một khách sạn              |
| DELETE | `/hotels/soft`          | Xóa mềm nhiều khách sạn            |
| POST   | `/hotels/restore/:id`   | Khôi phục một khách sạn            |
| POST   | `/hotels/restore`       | Khôi phục nhiều khách sạn          |
| DELETE | `/hotels/permanent/:id` | Xóa vĩnh viễn khách sạn            |

Body tạo khách sạn:

```json
{
    "name": "Ocean View",
    "description": "Khách sạn gần biển",
    "address": "Phú Quốc",
    "phone": "0901234567",
    "email": "info@ocean.com",
    "checkin_time": "14:00",
    "checkout_time": "12:00",
    "latitude": 10.1234567,
    "longitude": 106.1234567,
    "status": "active"
}
```

---

### 6.6. Media

| Method | Endpoint               | Mô tả                             |
| ------ | ---------------------- | --------------------------------- |
| GET    | `/media/active`        | Danh sách media đang hoạt động    |
| GET    | `/media/deleted`       | Danh sách media đã xóa mềm        |
| GET    | `/media/active/:id`    | Chi tiết media đang hoạt động     |
| GET    | `/media/deleted/:id`   | Chi tiết media đã xóa mềm         |
| POST   | `/media`               | Tạo media từ URL hoặc upload file |
| PATCH  | `/media/:id`           | Cập nhật media                    |
| DELETE | `/media/soft/:id`      | Xóa mềm một media                 |
| DELETE | `/media/soft`          | Xóa mềm nhiều media               |
| POST   | `/media/restore/:id`   | Khôi phục một media               |
| POST   | `/media/restore`       | Khôi phục nhiều media             |
| DELETE | `/media/permanent/:id` | Xóa vĩnh viễn media               |

Tạo media bằng URL:

```json
{
    "fileName": "room.jpg",
    "url": "https://image.host/img.jpg"
}
```

Tạo media bằng file upload:

```txt
Content-Type: multipart/form-data

fileName=room.jpg
file=<binary>
```

---

### 6.7. Posts

| Method | Endpoint               | Mô tả                             |
| ------ | ---------------------- | --------------------------------- |
| GET    | `/posts/active`        | Danh sách bài viết đang hoạt động |
| GET    | `/posts/deleted`       | Danh sách bài viết đã xóa mềm     |
| GET    | `/posts/active/:id`    | Chi tiết bài viết đang hoạt động  |
| GET    | `/posts/deleted/:id`   | Chi tiết bài viết đã xóa mềm      |
| POST   | `/posts`               | Tạo bài viết                      |
| PATCH  | `/posts/:id`           | Cập nhật bài viết                 |
| DELETE | `/posts/soft/:id`      | Xóa mềm một bài viết              |
| DELETE | `/posts/soft`          | Xóa mềm nhiều bài viết            |
| POST   | `/posts/restore/:id`   | Khôi phục một bài viết            |
| POST   | `/posts/restore`       | Khôi phục nhiều bài viết          |
| DELETE | `/posts/permanent/:id` | Xóa vĩnh viễn bài viết            |

Body tạo bài viết:

```json
{
    "post_type": "ARTICLE",
    "title": "Vịnh Hạ Long",
    "excerpt": "Giới thiệu ngắn",
    "content": "Nội dung bài viết",
    "status": "DRAFT",
    "primary_category_id": 3
}
```

---

### 6.8. Roles

| Method | Endpoint               | Mô tả                            |
| ------ | ---------------------- | -------------------------------- |
| GET    | `/roles/active`        | Danh sách vai trò đang hoạt động |
| GET    | `/roles/deleted`       | Danh sách vai trò đã xóa mềm     |
| GET    | `/roles/active/:id`    | Chi tiết vai trò đang hoạt động  |
| GET    | `/roles/deleted/:id`   | Chi tiết vai trò đã xóa mềm      |
| POST   | `/roles`               | Tạo vai trò                      |
| PATCH  | `/roles/:id`           | Cập nhật vai trò                 |
| DELETE | `/roles/soft/:id`      | Xóa mềm một vai trò              |
| DELETE | `/roles/soft`          | Xóa mềm nhiều vai trò            |
| POST   | `/roles/restore/:id`   | Khôi phục một vai trò            |
| POST   | `/roles/restore`       | Khôi phục nhiều vai trò          |
| DELETE | `/roles/permanent/:id` | Xóa vĩnh viễn vai trò            |

Body tạo vai trò:

```json
{
    "name": "Moderator",
    "description": "Quản lý bình luận"
}
```

---

### 6.9. Room Types

| Method | Endpoint                    | Mô tả                               |
| ------ | --------------------------- | ----------------------------------- |
| GET    | `/room-types/active`        | Danh sách loại phòng đang hoạt động |
| GET    | `/room-types/deleted`       | Danh sách loại phòng đã xóa mềm     |
| GET    | `/room-types/active/:id`    | Chi tiết loại phòng đang hoạt động  |
| GET    | `/room-types/deleted/:id`   | Chi tiết loại phòng đã xóa mềm      |
| POST   | `/room-types`               | Tạo loại phòng                      |
| PATCH  | `/room-types/:id`           | Cập nhật loại phòng                 |
| DELETE | `/room-types/soft/:id`      | Xóa mềm một loại phòng              |
| DELETE | `/room-types/soft`          | Xóa mềm nhiều loại phòng            |
| POST   | `/room-types/restore/:id`   | Khôi phục một loại phòng            |
| POST   | `/room-types/restore`       | Khôi phục nhiều loại phòng          |
| DELETE | `/room-types/permanent/:id` | Xóa vĩnh viễn loại phòng            |

Body tạo loại phòng:

```json
{
    "hotel_id": 1,
    "name": "Deluxe",
    "description": "View biển",
    "base_price": 1500000,
    "max_guests": 3,
    "bed_type": "Queen",
    "is_active": true
}
```

---

### 6.10. Room Inventory

| Method | Endpoint                                        | Mô tả                                   |
| ------ | ----------------------------------------------- | --------------------------------------- |
| GET    | `/room-inventory/active`                        | Danh sách tồn kho phòng đang hoạt động  |
| GET    | `/room-inventory/deleted`                       | Danh sách tồn kho phòng đã xóa mềm      |
| GET    | `/room-inventory/active/:room_type_id/:date`    | Chi tiết tồn kho đang hoạt động         |
| GET    | `/room-inventory/deleted/:room_type_id/:date`   | Chi tiết tồn kho đã xóa mềm             |
| POST   | `/room-inventory`                               | Tạo tồn kho phòng                       |
| PATCH  | `/room-inventory/:room_type_id/:date`           | Cập nhật tồn kho phòng                  |
| DELETE | `/room-inventory/soft/:room_type_id/:date`      | Xóa mềm một bản ghi tồn kho             |
| DELETE | `/room-inventory/soft/:room_type_id`            | Xóa mềm nhiều bản ghi theo loại phòng   |
| POST   | `/room-inventory/restore/:room_type_id/:date`   | Khôi phục một bản ghi tồn kho           |
| POST   | `/room-inventory/restore/:room_type_id`         | Khôi phục nhiều bản ghi theo loại phòng |
| DELETE | `/room-inventory/permanent/:room_type_id/:date` | Xóa vĩnh viễn tồn kho                   |

Body tạo tồn kho:

```json
{
    "room_type_id": 3,
    "date": "2025-12-31",
    "allotment": 8,
    "price": 1500000
}
```

---

### 6.11. Sliders

| Method | Endpoint                 | Mô tả                           |
| ------ | ------------------------ | ------------------------------- |
| GET    | `/sliders/active`        | Danh sách slider đang hoạt động |
| GET    | `/sliders/deleted`       | Danh sách slider đã xóa mềm     |
| GET    | `/sliders/active/:id`    | Chi tiết slider đang hoạt động  |
| GET    | `/sliders/deleted/:id`   | Chi tiết slider đã xóa mềm      |
| POST   | `/sliders`               | Tạo slider                      |
| PATCH  | `/sliders/:id`           | Cập nhật slider                 |
| DELETE | `/sliders/soft/:id`      | Xóa mềm một slider              |
| DELETE | `/sliders/soft`          | Xóa mềm nhiều slider            |
| POST   | `/sliders/restore/:id`   | Khôi phục một slider            |
| POST   | `/sliders/restore`       | Khôi phục nhiều slider          |
| DELETE | `/sliders/permanent/:id` | Xóa vĩnh viễn slider            |

Body tạo slider:

```json
{
    "title": "Homepage Hero",
    "mediaId": 5,
    "linkUrl": "https://example.com/promo",
    "postId": 101,
    "isShow": true
}
```

---

### 6.12. Settings

| Method | Endpoint                   | Mô tả                             |
| ------ | -------------------------- | --------------------------------- |
| GET    | `/settings/active`         | Danh sách cấu hình đang hoạt động |
| GET    | `/settings/deleted`        | Danh sách cấu hình đã xóa mềm     |
| GET    | `/settings/active/:key`    | Chi tiết cấu hình đang hoạt động  |
| GET    | `/settings/deleted/:key`   | Chi tiết cấu hình đã xóa mềm      |
| POST   | `/settings`                | Tạo cấu hình                      |
| PATCH  | `/settings/:key`           | Cập nhật cấu hình                 |
| DELETE | `/settings/soft/:key`      | Xóa mềm một cấu hình              |
| DELETE | `/settings/soft`           | Xóa mềm nhiều cấu hình            |
| POST   | `/settings/restore/:key`   | Khôi phục một cấu hình            |
| POST   | `/settings/restore`        | Khôi phục nhiều cấu hình          |
| DELETE | `/settings/permanent/:key` | Xóa vĩnh viễn cấu hình            |

Body tạo setting:

```json
{
    "start_web": 1,
    "key": "site_name",
    "group_key": "general",
    "label": "Tên website",
    "value_string": "My Awesome Site",
    "input_type": "text",
    "is_public": true,
    "is_secure": false,
    "sort_order": 1
}
```

---

## 7. Quy ước API CRUD

Phần lớn các module trong hệ thống sử dụng chung quy ước endpoint:

| Hành động                    | Endpoint mẫu                       |
| ---------------------------- | ---------------------------------- |
| Lấy danh sách đang hoạt động | `GET /<resource>/active`           |
| Lấy danh sách đã xóa mềm     | `GET /<resource>/deleted`          |
| Lấy chi tiết đang hoạt động  | `GET /<resource>/active/:id`       |
| Lấy chi tiết đã xóa mềm      | `GET /<resource>/deleted/:id`      |
| Tạo mới                      | `POST /<resource>`                 |
| Cập nhật                     | `PATCH /<resource>/:id`            |
| Xóa mềm một bản ghi          | `DELETE /<resource>/soft/:id`      |
| Xóa mềm nhiều bản ghi        | `DELETE /<resource>/soft`          |
| Khôi phục một bản ghi        | `POST /<resource>/restore/:id`     |
| Khôi phục nhiều bản ghi      | `POST /<resource>/restore`         |
| Xóa vĩnh viễn                | `DELETE /<resource>/permanent/:id` |

---

## 8. Phân trang

Các API danh sách thường hỗ trợ query:

```txt
?page=1&limit=10
```

Ví dụ:

```http
GET /hotels/active?page=1&limit=10
```

Response có `meta`:

```json
{
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 37
    }
}
```

---

## 9. Upload file

Một số API như `/media` hỗ trợ upload file bằng `multipart/form-data`.

Ví dụ với cURL:

```bash
curl -X POST http://localhost:3000/media \
  -H "Authorization: Bearer <JWT>" \
  -F "fileName=room.jpg" \
  -F "file=@./room.jpg"
```

Hoặc tạo media từ URL:

```bash
curl -X POST http://localhost:3000/media \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"room.jpg","url":"https://image.host/img.jpg"}'
```

---

## 10. Lệnh thường dùng

```bash
# Cài package
npm install

# Chạy development
npm run start:dev

# Build production
npm run build

# Chạy production
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

---

## 11. Gợi ý cấu trúc thư mục

```txt
src/
├── auth/
├── users/
├── roles/
├── customers/
├── bookings/
├── categories/
├── hotels/
├── room-types/
├── room-inventory/
├── media/
├── hotel-room-images/
├── posts/
├── post-media/
├── sliders/
├── settings/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
└── main.ts
```

---

## 12. Ghi chú phát triển

Khi phát triển hoặc kiểm thử API, cần chú ý:

- Các API quản trị cần gửi `Authorization: Bearer <JWT>`.
- Các tham số `id`, `page`, `limit` phải là số hợp lệ.
- Các API danh sách hỗ trợ phân trang.
- Các module có hỗ trợ xóa mềm cần phân biệt dữ liệu active và deleted.
- Với media, chỉ nên chọn một trong hai nguồn: upload file hoặc URL.
- Với booking, cần đảm bảo `customer_id`, `hotel_id`, `room_type_id` tồn tại trước khi tạo.
- Với hotel, category, post, slug thường được sinh tự động từ tên/tiêu đề.
- Với room inventory, khóa dữ liệu thường phụ thuộc vào `room_type_id` và `date`.

---

## 13. Tác giả

- Dự án: **BE Web Travel**
- Tác giả: Nguyễn Trí Dũng
- Zalo: 0378519357
- Mục đích: Xây dựng backend API phục vụ hệ thống website du lịch, khách sạn và đặt phòng.
