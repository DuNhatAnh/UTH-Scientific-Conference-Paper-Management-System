# 🎓 UTH-ConfMS
## Hệ Thống Quản Lý Giấy Tờ Hội Nghị Nghiên Cứu Khoa Học
### Trường Đại Học UTH

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-FF6600?logo=rabbitmq)](https://www.rabbitmq.com/)

---

## 📋 Tổng Quan

**UTH-ConfMS** là một hệ thống quản lý hội nghị khoa học toàn diện, được thiết kế dành cho các khoa tại Trường Đại Học UTH. Hệ thống tập hợp các quy trình hội nghị rời rạc—từ kêu gọi bài báo, nộp bài, phản biện, ra quyết định, thu thập bản sửa cuối cùng, đến xuất bản—vào một nền tảng duy nhất và tích hợp.

Hệ thống được xây dựng theo kiến trúc **microservices** hiện đại với các công nghệ tiên tiến nhất. UTH-ConfMS hỗ trợ đầy đủ toàn bộ quy trình từ kêu gọi bài báo (Call for Papers), nộp bài báo (Submission), phân công phản biện (Review Assignment), đến quyết định chấp nhận/từ chối (Decision), thu thập bản sửa cuối cùng (Camera-ready), và xuất bản kỷ yếu (Proceedings).

### Tính Năng Chính

- ✅ **Quy Trình Tập Trung**: Quản lý toàn diện từ kêu gọi bài → nộp bài → phản biện → ra quyết định → bản sửa cuối → xuất bản
- ✅ **Kiểm Soát Truy Cập Theo Vai Trò (RBAC)**: Admin, Chủ tịch, Tác giả, Phản biện, Người tham dự với quyền hạn chi tiết
- ✅ **Quản Lý Xung Đột Lợi Ích (COI)**: Phát hiện và chặn tự động những trường hợp xung đột
- ✅ **Chế Độ Phản Biện Linh Hoạt**: Hỗ trợ phản biện kín hai chiều, một chiều hoặc công khai
- ✅ **Công Cụ Hỗ Trợ AI** (Tùy chọn): Kiểm tra chính tả, tóm tắt bản tóm lược, gợi ý độ phù hợp giữa phản biện và bài báo
- ✅ **Bảo Mật Cấp Doanh Nghiệp**: Xác thực JWT, mã hóa mật khẩu, nhật ký kiểm toán, hỗ trợ SSO
- ✅ **Kiến Trúc Có Thể Mở Rộng**: Thiết kế microservices, lưu trữ tạm, xử lý bất đồng bộ
- ✅ **Giao Diện Đa Ngôn Ngữ**: Hỗ trợ tiếng Anh/tiếng Việt với quốc tế hóa (i18n)
- ✅ **Thông Báo Thời Gian Thực**: Thông báo qua email và ứng dụng qua SignalR
- ✅ **Kiểm Toán & Tuân Thủ**: Nhật ký đầy đủ, xuất dữ liệu, thiết kế sẵn sàng cho GDPR

---

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu Hệ Thống

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)
- PostgreSQL 15+ (hoặc dùng Docker)
- Redis 7+ (hoặc dùng Docker)

### Phương Án 1: Docker Compose (Khuyến Nghị)

```bash
# Clone repository
git clone https://github.com/your-org/UTH-Scientific-Conference-Paper-Management-System.git
cd UTH-Scientific-Conference-Paper-Management-System

# Khởi động tất cả dịch vụ (sẽ tự động xây dựng và khởi động)
docker-compose up -d --build

# Kiểm tra nhật ký
docker-compose logs -f

# Truy cập hệ thống
# Frontend: http://localhost:3000
# API Gateway: http://localhost:5000
# Quản lý RabbitMQ: http://localhost:15672 (guest/guest)

# Dừng tất cả dịch vụ
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

### Phương Án 2: Thiết Lập Phát Triển

```bash
# 1. Khởi động chỉ cơ sở hạ tầng
docker-compose up -d postgres redis rabbitmq

# 2. Chạy backend services (mở terminal riêng cho mỗi dịch vụ)
cd UTH-ConfMS-Backend/ApiGateway && dotnet run
cd UTH-ConfMS-Backend/Services/Identity.Service && dotnet run
cd UTH-ConfMS-Backend/Services/Conference.Service && dotnet run
# ... lặp lại cho các dịch vụ khác

# 3. Chạy frontend
cd UTH-ConfMS-Frontend
npm install
npm run dev
```

### ⚙️ Cấu Hình Biến Môi Trường

Tạo file `.env` trong thư mục gốc:

```env
# Cơ Sở Dữ Liệu
POSTGRES_USER=confms_admin
POSTGRES_PASSWORD=SecurePassword123!
POSTGRES_DB=uth_confms
POSTGRES_PORT=5432

# JWT
JWT_SECRET=uth-confms-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRATION_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRATION_DAYS=7

# SMTP (cho thông báo qua email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@uth-confms.edu.vn
SMTP_FROM_NAME=Hệ Thống Quản Lý Hội Nghị UTH

# API Gateway
API_GATEWAY_URL=http://localhost:5000

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SITE_NAME=Hệ Thống Quản Lý Hội Nghị UTH

# Dịch Vụ AI (Tùy chọn)
AI_SERVICE_ENABLED=false
AI_SERVICE_URL=http://ai-service:8000

# Tải Lên Tệp
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_EXTENSIONS=.pdf,.doc,.docx
```

### 🔑 Tài Khoản Thử Nghiệm Mặc Định

| Vai Trò | Email | Mật Khẩu |
|---------|-------|----------|
| Quản Trị Viên | admin@uth.edu.vn | Admin@123456 |
| Chủ Tịch | chair@uth.edu.vn | Chair@123456 |
| Tác Giả | author@uth.edu.vn | Author@123456 |
| Phản Biện | reviewer@uth.edu.vn | Reviewer@123456 |

---

## 📊 Kiến Trúc Hệ Thống

### Kiến Trúc Microservices

```
┌──────────────────────────────────────────────────────────────┐
│              Frontend (React) - Port 3000                    │
│        TypeScript | Vite | TailwindCSS | Quốc tế hóa         │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTPS/HTTP
┌─────────────────────────▼──────────────────────────────────┐
│            API Gateway (Ocelot) - Port 5000                │
│     Xác thực JWT | Giới hạn tốc độ | CORS | Định tuyến     │
└──┬──────┬──────┬──────┬──────┬──────┬────────────────┬────┘
   │      │      │      │      │      │                │
┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐         ┌──┴──┐
│ĐTC  ││HNG  ││NBS  ││ PB  ││TBK  ││AI  │         │Data  │
│:5001││:5002││:5003││:5004││:5005││:8000│◄─────┤Layer │
└─────┘ └────┘ └────┘ └────┘ └────┘ └─────┘         └──┬──┘
   ▲      ▲      ▲      ▲      ▲      ▲                │
   │      │      │      │      │      │                │
   └──────┴──────┴──────┴──────┴──────┘                │
                 ▼                                      │
        ┌─────────────────┐                            │
        │   RabbitMQ      │                            │
        │  (Hàng Đợi Sự   │                            │
        │      Kiện)      │                            │
        └─────────────────┘                            │
           │          │                                 │
           ▼          ▼                                 │
    ┌──────────┐ ┌──────────┐ ◄──────────────────────┘
    │PostgreSQL│ │  Redis   │
    │  :5432   │ │  :6379   │
    └──────────┘ └──────────┘
```

**Chú thích**: ĐTC = Dịch vụ Đăng Nhập/Xác Thực, HNG = Hội Nghị, NBS = Nộp Bài Sớm, PB = Phản Biện, TBK = Thông Báo Khác

### Tổng Quan Các Dịch Vụ

| Dịch Vụ | Port | Công Nghệ | Mục Đích | Trạng Thái |
|---------|------|-----------|---------|-----------|
| **Dịch Vụ Xác Thực** | 5001 | C# .NET 8 | Xác thực, RBAC, SSO | ✅ Hoạt động |
| **Dịch Vụ Hội Nghị** | 5002 | C# .NET 8 | Thiết lập hội nghị, CFP, tracks | ✅ Hoạt động |
| **Dịch Vụ Nộp Bài** | 5003 | C# .NET 8 | Nộp bài báo, quản lý phiên bản | ✅ Hoạt động |
| **Dịch Vụ Phản Biện** | 5004 | C# .NET 8 | Phân công phản biện, quyết định | ✅ Hoạt động |
| **Dịch Vụ Thông Báo** | 5005 | C# .NET 8 | Thông báo email & ứng dụng | ✅ Hoạt động |
| **Dịch Vụ AI** | 8000 | Python 3.11 | NLP, kiểm tra chính tả, gợi ý | 🔄 Tùy chọn |
| **API Gateway** | 5000 | Ocelot | Định tuyến yêu cầu, xác thực | ✅ Hoạt động |
| **Frontend** | 3000 | React 18 | Giao diện web | ✅ Hoạt động |
| **PostgreSQL** | 5432 | 15+ | Cơ sở dữ liệu chính | ✅ Hoạt động |
| **Redis** | 6379 | 7+ | Lưu trữ tạm, phiên làm việc | ✅ Hoạt động |
| **RabbitMQ** | 5672 | 3.12+ | Nhắn tin bất đồng bộ | ✅ Hoạt động |

---

## 🏗️ Cấu Trúc Dự Án

```
UTH-Scientific-Conference-Paper-Management-System/
│
├── 📄 docker-compose.yml              # Cấu hình Docker Compose
├── 📄 package.json                    # Phụ thuộc Node.js
├── 📄 README.md                       # Tài liệu này
├── 📄 .env.example                    # Mẫu biến môi trường
│
├── 📂 database/                       # Script khởi tạo PostgreSQL
│   ├── 01_identity_schema.sql         # Người dùng, Vai trò, Quyền hạn
│   ├── 02_conference_schema.sql       # Hội nghị, Tracks, CFP
│   ├── 03_submission_schema.sql       # Bài báo, Tác giả, Tệp
│   ├── 04_review_schema.sql           # Phản biện, Phân công, Quyết định
│   ├── 05_notification_schema.sql     # Thông báo, Hàng đợi email
│   ├── 06_admin_schema.sql            # Cấu hình hệ thống, Nhật ký
│   └── migrations/                    # Thay đổi cơ sở dữ liệu
│
├── 📂 UTH-ConfMS-Backend/             # Các dịch vụ .NET
│   │
│   ├── 📂 ApiGateway/                 # API Gateway Ocelot (:5000)
│   │   ├── Program.cs                 # Điểm vào ứng dụng
│   │   ├── ocelot.json               # Cấu hình định tuyến
│   │   ├── appsettings.json          # Cài đặt ứng dụng
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   ├── 📂 Services/                   # Các dịch vụ cơ bản
│   │   │
│   │   ├── 📂 Identity.Service/       # Xác thực & Phân quyền (:5001)
│   │   │   ├── Controllers/           # AuthController, UsersController
│   │   │   ├── Services/              # AuthService, TokenService
│   │   │   ├── Entities/              # User, Role, Permission
│   │   │   ├── DTOs/                  # LoginDto, RegisterDto
│   │   │   ├── Data/                  # DbContext, Migrations
│   │   │   ├── Repositories/          # Mẫu truy cập dữ liệu
│   │   │   └── Validators/            # Xác thực đầu vào
│   │   │
│   │   ├── 📂 Conference.Service/     # Quản Lý Hội Nghị (:5002)
│   │   │   ├── Controllers/           # ConferencesController, TracksController
│   │   │   ├── Entities/              # Conference, Track, CallForPapers
│   │   │   ├── Services/              # ConferenceService, TrackService
│   │   │   ├── Data/                  # DbContext
│   │   │   └── DTOs/                  # ConferenceDto, TrackDto
│   │   │
│   │   ├── 📂 Submission.Service/     # Nộp Bài Báo (:5003)
│   │   │   ├── Controllers/           # SubmissionsController
│   │   │   ├── Entities/              # Submission, Author, SubmissionFile
│   │   │   ├── Services/              # SubmissionService, FileService
│   │   │   └── Data/                  # DbContext
│   │   │
│   │   ├── 📂 Review.Service/         # Quy Trình Phản Biện (:5004)
│   │   │   ├── Controllers/           # ReviewsController, AssignmentsController
│   │   │   ├── Entities/              # Review, ReviewAssignment, Decision
│   │   │   ├── Services/              # ReviewService, AssignmentService
│   │   │   └── Data/                  # DbContext
│   │   │
│   │   ├── 📂 Notification.Service/   # Thông Báo (:5005)
│   │   │   ├── Controllers/           # NotificationsController
│   │   │   ├── Services/              # EmailService, NotificationService
│   │   │   ├── Hubs/                  # SignalR hubs (thời gian thực)
│   │   │   └── Data/                  # DbContext
│   │   │
│   │   └── 📂 AI.Service/             # Dịch Vụ AI (:8000) [Tùy chọn]
│   │       ├── main.py                # Ứng dụng FastAPI
│   │       ├── models.py              # Mô hình Pydantic
│   │       ├── requirements.txt       # Phụ thuộc Python
│   │       └── Dockerfile
│   │
│   └── 📂 Shared/                     # Tiện ích & Hằng số dùng chung
│       └── 📂 UTH.ConfMS.Shared/
│           ├── Constants/             # Hằng số dùng chung
│           ├── Models/                # DTOs & Mô hình dùng chung
│           └── Utilities/             # Phương thức trợ giúp
│
├── 📂 UTH-ConfMS-Frontend/            # Ứng Dụng React
│   ├── Dockerfile
│   ├── nginx.conf                     # Cấu hình proxy ngược
│   ├── package.json                   # Phụ thuộc
│   ├── vite.config.ts                 # Cấu hình xây dựng
│   ├── tsconfig.json                  # Cấu hình TypeScript
│   ├── tailwind.config.js             # Cấu hình CSS framework
│   │
│   ├── 📂 public/
│   │   └── locales/                   # Bản dịch i18n (en, vi)
│   │
│   └── 📂 src/
│       ├── App.tsx                    # Thành phần chính với Router
│       ├── index.tsx                  # Điểm vào
│       │
│       ├── 📂 pages/                  # Thành phần trang
│       │   ├── Auth/                  # Đăng nhập, Đăng ký, Quên mật khẩu
│       │   ├── Public/                # Trang chủ, Danh sách hội nghị
│       │   ├── Author/                # Bảng điều khiển tác giả
│       │   ├── Chair/                 # Bảng điều khiển chủ tịch
│       │   ├── Reviewer/              # Bảng điều khiển phản biện
│       │   └── Admin/                 # Bảng điều khiển quản trị viên
│       │
│       ├── 📂 components/             # Thành phần UI tái sử dụng
│       │   ├── Navbar.tsx
│       │   ├── Footer.tsx
│       │   ├── LoadingSpinner.tsx
│       │   └── ...
│       │
│       ├── 📂 contexts/               # Nhà cung cấp Context của React
│       │   └── AuthContext.tsx        # Trạng thái xác thực toàn cục
│       │
│       ├── 📂 services/               # Phương thức gọi API
│       │   ├── apiClient.ts           # Instance Axios
│       │   ├── authApi.ts             # Điểm cuối xác thực
│       │   ├── conferenceApi.ts       # Điểm cuối hội nghị
│       │   └── submissionApi.ts       # Điểm cuối nộp bài
│       │
│       └── 📂 assets/                 # Hình ảnh, phông chữ, tệp tĩnh
│
└── 📂 UTH-ConfMS-Docs/                # Tài liệu
    └── README.md                      # Hướng dẫn phát triển
```

---

## 🎯 Tính Năng Chính Theo Vai Trò

### 👨‍💼 Chủ Tịch Hội Nghị

**Quản Lý Hội Nghị**
- Tạo và cấu hình hội nghị mới với siêu dữ liệu
- Đặt hạn chót nộp bài và lịch trình phản biện
- Định nghĩa tracks và các chủ đề
- Tạo/tùy chỉnh Kêu gọi Bài báo (CFP)
- Xuất bản/ẩn CFP
- Xem thống kê hội nghị và tiến độ

**Quản Lý Ban Chương Trình**
- Mời thành viên ban chương trình và phản biện
- Quản lý hồ sơ và chuyên môn
- Theo dõi khối lượng công việc phản biện
- Loại bỏ phản biện có xung đột
- Theo dõi tiến độ phản biện theo thời gian thực

**Quá Trình Phản Biện & Quyết Định**
- Phân công bài báo cho phản biện (thủ công hoặc dựa trên AI)
- Xem các bài phản biện và điểm số
- Ra quyết định chấp nhận/từ chối cuối cùng
- Tạo email thông báo
- Xuất danh sách quyết định

### 📝 Tác Giả

**Quản Lý Nộp Bài**
- Tạo và nộp bài báo với siêu dữ liệu đầy đủ
- Thêm tác giả đồng tác giả
- Tải lên bản thảo PDF
- Chọn tracks/chủ đề phù hợp
- Chỉnh sửa trước hạn chót

**Theo Dõi Trạng Thái**
- Bảng điều khiển với các bài đã nộp
- Cập nhật trạng thái theo thời gian thực
- Xem điểm phản biện và phản hồi ẩn danh
- Truy cập hướng dẫn bản sửa cuối cùng

**Sửa Đổi & Phản Hồi**
- Tải lên tài liệu sửa đổi nếu cần
- Trả lời bình luận của phản biện
- Theo dõi hạn chót sửa đổi

### 🔍 Phản Biện / Thành Viên Ban Chương Trình

**Quy Trình Phản Biện**
- Truy cập bài báo được phân công với siêu dữ liệu ẩn danh
- Tải về và phản biện bản thảo
- Gửi điểm số theo nhiều tiêu chí
- Viết bình luận và khuyến nghị chi tiết
- Khai báo xung đột lợi ích

**Thảo Luận & Thỏa Thuận**
- Tham gia thảo luận nội bộ ban chương trình
- Xem bình luận của phản biện khác
- Cập nhật điểm số dựa trên thảo luận

### 🏛️ Quản Trị Viên Hệ Thống

**Quản Lý Người Dùng**
- Tạo/chỉnh sửa/xóa tài khoản
- Gán vai trò và quyền hạn
- Đặt lại mật khẩu
- Quản lý nhóm người dùng

**Cấu Hình Hệ Thống**
- Cài đặt SMTP cho thông báo email
- Giới hạn email và giới hạn tốc độ
- Cài đặt tải lên tệp
- Chính sách toàn hệ thống

**Quản Lý Nhiều Hội Nghị**
- Quản lý nhiều hội nghị cùng một lúc
- Xem phân tích trên nhiều hội nghị
- Quản lý nhóm thành viên ban chương trình dùng chung
- Cấu hình mẫu thông báo

**Kiểm Toán & Tuân Thủ**
- Xem nhật ký kiểm toán đầy đủ
- Xuất báo cáo hệ thống
- Theo dõi tình trạng hệ thống
- Sao lưu/khôi phục dữ liệu

---

## 🔄 Quy Trình Hội Nghị

### Quy Trình Chi Tiết

```
Giai Đoạn 1: THIẾT LẬP
├─ Chủ tịch tạo hội nghị
├─ Chủ tịch đặt hạn chót
├─ Chủ tịch cấu hình tracks/chủ đề
└─ Chủ tịch xuất bản Kêu gọi Bài báo

         ↓ Hạn chót CFP

Giai Đoạn 2: NỘP BÀI
├─ Tác giả nộp bài báo
├─ Tác giả thêm đồng tác giả
├─ Tác giả tải lên PDF
└─ Tác giả có thể chỉnh sửa trước hạn chót

      ↓ Hạn chót nộp bài

Giai Đoạn 3: PHÂN CÔNG PHẢN BIỆN
├─ Chủ tịch mời thành viên ban chương trình
├─ Hệ thống phát hiện Xung Đột Lợi Ích
├─ Chủ tịch phân công phản biện (thủ công hoặc AI)
└─ Phản biện chấp nhận/từ chối phân công

      ↓ Kỳ phản biện

Giai Đoạn 4: PHẢN BIỆN ĐỒNG NGHIỆP
├─ Phản biện đọc bài báo
├─ Phản biện gửi điểm số & bình luận
├─ (Tùy chọn) Ban chương trình thảo luận
├─ (Tùy chọn) Tác giả phản bác
└─ Phản biện hoàn thiện khuyến nghị

      ↓ Hạn chót phản biện

Giai Đoạn 5: RA QUYẾT ĐỊNH
├─ Chủ tịch xem xét điểm số tổng hợp
├─ Chủ tịch ra quyết định chấp nhận/từ chối
├─ Hệ thống gửi thông báo quyết định
└─ Hệ thống lưu trữ quyết định

      ↓ Thông báo quyết định

Giai Đoạn 6: BẢN SỬA CUỐI CÙNG
├─ Tác giả tải lên bản sửa cuối cùng
├─ Hệ thống xác thực định dạng tệp
├─ Chủ tịch phê duyệt/yêu cầu thay đổi
└─ Bản kỷ yếu cuối cùng sẵn sàng

      ↓ Hạn chót bản sửa cuối cùng

Giai Đoạn 7: XUẤT BẢN
├─ Xuất kỷ yếu (PDF, siêu dữ liệu)
├─ Tạo lịch trình chương trình
├─ Xuất bản bài báo được chấp nhận (nếu được bật)
└─ Lưu trữ dữ liệu hội nghị
```

### Trạng Thái Bài Báo

```
┌───────┐                    ┌──────────┐
│ NHÁP  │──gửi────────────▶  │ ĐÃ GỬI   │
└───────┘                    └─────┬────┘
                                   │ phân công phản biện
                                   ▼
                          ┌────────────────┐
                          │ ĐANG PHẢN BIỆN │
                          └────────┬───────┘
                                   │ tất cả phản biện hoàn tất
                      ┌────────────┼───────────┐
                      │            │           │
                      ▼            ▼           ▼
                  ┌──────────┐ ┌──────────┐ ┌──────────────┐
                  │ CHẤP NHẬN│ │ TỪ CHỐI  │ │CẦN SỬA ĐỔI   │
                  └──────────┘ └──────────┘ └──────┬───────┘
                                                   │ gửi sửa đổi
                                                   ▼
                                         ĐANG PHẢN BIỆN (lặp lại)
```

---

## 🔐 Tính Năng Bảo Mật

### Xác Thực & Phân Quyền
- ✅ Token JWT với cơ chế làm mới
- ✅ Mã hóa mật khẩu an toàn (BCrypt với hệ số chi phí 12)
- ✅ RBAC đa vai trò với quyền hạn chi tiết
- ✅ Hết thời gian phiên và đăng xuất tự động
- ✅ Giới hạn tốc độ API để ngăn chặn lạm dụng
- ✅ Cấu hình CORS cho quyền truy cập kiểm soát

### Bảo Vệ Dữ Liệu
- ✅ Mã hóa HTTPS/TLS trong quá trình truyền
- ✅ Mã hóa cơ sở dữ liệu khi lưu trữ (PostgreSQL)
- ✅ Che giấu dữ liệu nhạy cảm trong nhật ký
- ✅ Xử lý dữ liệu tuân thủ GDPR
- ✅ Chế độ phản biện kín hai chiều với ẩn danh
- ✅ Thực thi Xung Đột Lợi Ích (COI)

### Kiểm Toán & Tuân Thủ
- ✅ Nhật ký kiểm toán đầy đủ cho tất cả hành động
- ✅ Ghi nhật ký hoạt động người dùng
- ✅ Ghi nhật ký yêu cầu/phản hồi API
- ✅ Chức năng xuất dữ liệu
- ✅ Tạo báo cáo tuân thủ
- ✅ Nhật ký dấu vết đặt lại mật khẩu

---

## 📚 Tài Liệu API

### Điểm Cuối Xác Thực
```
POST   /api/auth/login              # Đăng nhập bằng email/mật khẩu
POST   /api/auth/register           # Tạo tài khoản người dùng mới
POST   /api/auth/refresh-token      # Làm mới token JWT
POST   /api/auth/logout             # Vô hiệu hóa token hiện tại
POST   /api/auth/forgot-password    # Yêu cầu đặt lại mật khẩu
POST   /api/auth/reset-password     # Hoàn thành đặt lại mật khẩu
```

### Quản Lý Hội Nghị
```
GET    /api/conferences             # Liệt kê tất cả hội nghị công khai
GET    /api/conferences/{id}        # Lấy chi tiết hội nghị
POST   /api/conferences             # Tạo hội nghị mới (Chủ tịch)
PUT    /api/conferences/{id}        # Cập nhật hội nghị
DELETE /api/conferences/{id}        # Xóa hội nghị

GET    /api/conferences/{id}/tracks          # Liệt kê tracks
POST   /api/conferences/{id}/tracks          # Tạo track
PUT    /api/conferences/{id}/tracks/{trackId}# Cập nhật track
DELETE /api/conferences/{id}/tracks/{trackId}# Xóa track

GET    /api/conferences/{id}/cfp            # Lấy Kêu gọi Bài báo
POST   /api/conferences/{id}/cfp            # Tạo/cập nhật CFP
PUT    /api/conferences/{id}/cfp            # Xuất bản CFP
```

### Nộp Bài Báo
```
GET    /api/submissions                     # Liệt kê nộp bài của người dùng
GET    /api/submissions/{id}                # Lấy chi tiết nộp bài
POST   /api/submissions                     # Nộp bài báo mới
PUT    /api/submissions/{id}                # Cập nhật nộp bài
DELETE /api/submissions/{id}                # Rút lại nộp bài
POST   /api/submissions/{id}/files          # Tải lên tệp bài báo
GET    /api/submissions/{id}/files          # Liệt kê tệp nộp bài
DELETE /api/submissions/{id}/files/{fileId} # Xóa tệp
```

### Phản Biện & Phân Công
```
GET    /api/reviews                         # Liệt kê phản biện của người dùng
GET    /api/reviews/{id}                    # Lấy chi tiết phản biện
POST   /api/reviews                         # Gửi phản biện
PUT    /api/reviews/{id}                    # Cập nhật phản biện

GET    /api/assignments                     # Liệt kê phân công phản biện
POST   /api/assignments                     # Tạo phân công
GET    /api/assignments/{id}/conflicts      # Kiểm tra xung đột lợi ích
```

### Quản Lý Người Dùng
```
GET    /api/users/profile                   # Lấy hồ sơ người dùng hiện tại
PUT    /api/users/profile                   # Cập nhật người dùng hiện tại
GET    /api/users/{id}                      # Lấy chi tiết người dùng (Quản trị viên)
PUT    /api/users/{id}                      # Cập nhật người dùng (Quản trị viên)
DELETE /api/users/{id}                      # Xóa người dùng (Quản trị viên)
```

Để xem tài liệu API chi tiết, truy cập Swagger UI tại:
- Dịch vụ Xác Thực: http://localhost:5001/swagger
- Dịch vụ Hội Nghị: http://localhost:5002/swagger
- Dịch vụ Nộp Bài: http://localhost:5003/swagger
- Dịch vụ Phản Biện: http://localhost:5004/swagger

---

## 🗄️ Sơ Đồ Cơ Sở Dữ Liệu

Hệ thống sử dụng PostgreSQL 15+ với 6 schema chuyên biệt, mỗi cái được quản lý bởi dịch vụ tương ứng:

| Schema | Dịch Vụ | Mục Đích | Bảng Chính |
|--------|---------|---------|-----------|
| identity | Dịch Vụ Xác Thực | Quản lý người dùng, xác thực, RBAC | users, roles, user_roles, refresh_tokens, audit_logs |
| conference | Dịch Vụ Hội Nghị | Thiết lập hội nghị | conferences, tracks, topics, cfp, pc_members |
| submission | Dịch Vụ Nộp Bài | Nộp bài báo | submissions, authors, submission_files |
| review | Dịch Vụ Phản Biện | Quy trình phản biện | review_assignments, reviews, decisions, coi |
| notification | Dịch Vụ Thông Báo | Email & nhắn tin | notifications, email_queue, email_templates |
| admin | Dịch Vụ Quản Trị | Cấu hình hệ thống | system_settings, system_logs |

### Các Thực Thể Chính

**Người Dùng** (identity.users)
- Tên đầy đủ, email, cơ quan, bộ phận
- ORCID, Google Scholar, tiểu sử
- Theo dõi đăng nhập cuối cùng, trạng thái tài khoản
- Quản lý token đặt lại mật khẩu

**Hội Nghị** (conference.conferences)
- Tên, viết tắt, vị trí, ngày tháng
- Chế độ phản biện (một chiều/hai chiều)
- Hạn chót nộp bài, phản biện, bản sửa cuối cùng
- Cài đặt trạng thái và hiển thị

**Nộp Bài** (submission.submissions)
- Tiêu đề, tóm lược, từ khóa
- Gán track/chủ đề
- Quy trình trạng thái
- Phiên bản tệp nhiều

**Phản Biện** (review.reviews)
- Điểm số theo nhiều tiêu chí
- Phản hồi bằng văn bản
- Khuyến nghị phản biện
- Dấu thời gian và phiên bản

**Quyết Định** (review.decisions)
- Chấp nhận/Từ chối/Sửa đổi Lớn/Sửa đổi Nhỏ
- Lý do của chủ tịch
- Trạng thái thông báo
- Bản ghi lưu trữ

Xem thư mục `database/` để có định nghĩa schema SQL đầy đủ.

---

## 🚀 Phát Triển & Triển Khai

### Phát Triển Cục Bộ

```bash
# Cài đặt phụ thuộc .NET
cd UTH-ConfMS-Backend/Services/Identity.Service
dotnet restore

# Cài đặt phụ thuộc Node
cd UTH-ConfMS-Frontend
npm install

# Chạy di cư cơ sở dữ liệu
dotnet ef database update

# Khởi động máy chủ phát triển
dotnet run                          # Backend
npm run dev                         # Frontend
```

### Xây Dựng Hình Ảnh Docker

```bash
# Xây dựng tất cả dịch vụ
docker-compose build

# Xây dựng dịch vụ cụ thể
docker-compose build identity-service

# Xem nhật ký xây dựng
docker-compose build --verbose
```

### Triển Khai Sản Xuất

```bash
# Sử dụng tệp compose sản xuất
docker-compose -f docker-compose.yml up -d

# Cấu hình biến môi trường
export JWT_SECRET="your-prod-secret-here"
export POSTGRES_PASSWORD="your-secure-password"

# Bật HTTPS
# Cập nhật nginx.conf và docker-compose.yml với chứng chỉ SSL

# Sao lưu cơ sở dữ liệu trước khi cập nhật
docker exec <postgres-container> pg_dump uth_confms > backup.sql
```

---

## 📊 Hiệu Năng & Khả Năng Mở Rộng

### Chiến Lược Tối Ưu Hóa
- ✅ **Lưu Trữ Tạm**: Redis cho dữ liệu được truy cập thường xuyên
- ✅ **Phân Trang**: Các điểm cuối API trả về kết quả được phân trang
- ✅ **Lập Chỉ Mục**: Chỉ mục cơ sở dữ liệu chiến lược trên khóa ngoài và trường tìm kiếm
- ✅ **Lưu Trữ Kết Nối**: Kết nối cơ sở dữ liệu được tối ưu hóa
- ✅ **Xử Lý Bất Đồng Bộ**: RabbitMQ cho thông báo email và xử lý sự kiện
- ✅ **Sẵn Sàng CDN**: Tài sản tĩnh được tối ưu hóa để phân phối CDN

### Xem Xét Khả Năng Mở Rộng
- Mở rộng ngang: Nhiều instance dịch vụ phía sau bộ cân bằng tải
- Sao chép cơ sở dữ liệu: Sao chép luồng PostgreSQL
- Bản sao đọc: Cho phân tích và báo cáo
- Xử lý sự kiện ngang: Nhiều người tiêu dùng RabbitMQ

---

## 📝 Giấy Phép

Dự án này được cấp giấy phép theo **Giấy Phép MIT** - xem tệp [LICENSE](LICENSE) để biết chi tiết.

---

## 🆘 Hỗ Trợ & Khắc Phục Sự Cố

### Vấn Đề Phổ Biến

**Docker Compose không khởi động**
```bash
# Kiểm tra Docker daemon đang chạy
docker ps

# Xem nhật ký dịch vụ
docker-compose logs <service-name>

# Xây dựng lại từ đầu
docker-compose down -v
docker-compose up -d --build
```

**Lỗi kết nối cơ sở dữ liệu**
```bash
# Xác minh PostgreSQL đang chạy
docker-compose ps postgres

# Kiểm tra chuỗi kết nối trong appsettings.json
# Mặc định: "Host=postgres;Port=5432;Database=uth_confms;User Id=confms_admin"

# Đặt lại cơ sở dữ liệu
docker-compose exec postgres psql -U confms_admin -d uth_confms -f /database/init.sql
```

**Hết thời gian chờ API Gateway**
```bash
# Tăng thời gian chờ trong ocelot.json
{
  "Routes": [{
    "DownstreamPathTemplate": "/api/{everything}",
    "RequestIdKey": "OcelotRequestId",
    "LoadBalancerOptions": { "Type": "LeastConnection" },
    "QoSOptions": { "TimeoutValue": 5000 }
  }]
}
```

### Nhận Trợ Giúp
- 📖 **Tài liệu**: Kiểm tra [docs/](UTH-ConfMS-Docs/)
- 🐛 **Báo Cáo Lỗi**: [Sự Cố GitHub](https://github.com/your-org/UTH-ConfMS/issues)
- 💬 **Thảo Luận**: [Thảo Luận GitHub](https://github.com/your-org/UTH-ConfMS/discussions)
- 📧 **Email**: support@uth-confms.edu.vn

---

## 🎓 Công Nghệ Sử Dụng

### Backend | Phía Máy Chủ
- **Framework**: ASP.NET Core 8.0
- **Cơ Sở Dữ Liệu**: PostgreSQL 15+
- **Lưu Trữ Tạm**: Redis 7+
- **API Gateway**: Ocelot
- **ORM**: Entity Framework Core
- **Hàng Đợi Thư**: RabbitMQ
- **Ghi Nhật Ký**: Serilog
- **Xác Thực**: FluentValidation

### Frontend | Phía Người Dùng
- **Framework**: React 18
- **Công Cụ Xây Dựng**: Vite 5
- **Ngôn Ngữ**: TypeScript 5
- **Kiểu Dáng**: TailwindCSS 3
- **Định Tuyến**: React Router
- **Máy Khách HTTP**: Axios
- **Quốc Tế Hóa**: i18next

### DevOps | Quản Lý Vận Hành
- **Đóng Gói**: Docker
- **Điều Phối**: Docker Compose
- **Proxy Ngược**: Nginx
- **CI/CD**: GitHub Actions (được khuyến khích)
- **Giám Sát**: (Prometheus/Grafana - tương lai)

---

## 📖 Tài Nguyên Bổ Sung

- [Tài Liệu Kiến Trúc Hệ Thống](UTH-ConfMS-Docs/)
- [Thông Số API Swagger](http://localhost:5000/swagger)
- [Hướng Dẫn Thiết Lập Nhà Phát Triển](UTH-ConfMS-Backend/README.md)
- [Hướng Dẫn Thiết Lập Frontend](UTH-ConfMS-Frontend/README.md)
- [Tham Chiếu Sơ Đồ Cơ Sở Dữ Liệu](database/)

---

## 🙏 Lời Cảm Ơn

UTH-ConfMS được phát triển dưới dạng một dự án học tập kết hợp các thực tiễn tốt nhất từ:
- Nền tảng quản lý hội nghị EasyChair
- Các mẫu kiến trúc microservices hiện đại
- Nghiên cứu mã nguồn mở về các hệ thống phản biện ngang hàng
- Hợp tác giữa các khoa tại Trường Đại Học UTH

**Người Hướng Dẫn Dự Án**: Bộ Môn Công Nghệ Thông Tin, Trường Đại Học UTH  
**Nhóm Phát Triển**: Sinh Viên Kỹ Sư Phần Mềm  
**Phiên Bản**: 1.0.0  
**Cập Nhật Lần Cuối**: Tháng 2 năm 2026  
**Trạng Thái**: Phát Triển Tích Cực 🚀

---

**Có câu hỏi?** Hãy mở một sự cố hoặc liên hệ với nhóm phát triển.

Được tạo với ❤️ cho Cộng Đồng Nghiên Cứu Học Tập
