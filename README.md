# 🎓 UTH-ConfMS - Conference Paper Management System
## Hệ Thống Quản Lý Hội Nghị Khoa Học UTH

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-FF6600?logo=rabbitmq)](https://www.rabbitmq.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📋 Tổng Quan

UTH-ConfMS là hệ thống quản lý hội nghị khoa học toàn diện, được xây dựng theo kiến trúc **microservices** với công nghệ hiện đại. Hệ thống hỗ trợ đầy đủ quy trình từ kêu gọi bài báo, nộp bài, phân công phản biện, đến quyết định chấp nhận/từ chối.

### ✅ Chức Năng Đã Hoàn Thành

#### 🏛️ Quản Lý Hội Nghị (Conference Management)
- ✅ Tạo và cấu hình hội nghị với đầy đủ metadata
- ✅ Quản lý **Tracks** (chủ đề con) của hội nghị
- ✅ Quản lý **Topics** và **Keywords**
- ✅ Cấu hình các **mốc thời gian** (deadlines)
- ✅ Quản lý **Committee Members** và **PC Members**
- ✅ Tạo và chỉnh sửa **Call for Papers (CFP)**
- ✅ Xem danh sách tất cả hội nghị công khai
- ✅ Trang chi tiết hội nghị với đầy đủ thông tin

#### 📝 Quản Lý Bài Báo (Submission Management)
- ✅ Nộp bài báo với metadata đầy đủ
- ✅ Upload file PDF
- ✅ Chọn Track cho bài nộp
- ✅ Quản lý danh sách tác giả (authors)
- ✅ Theo dõi trạng thái bài nộp
- ✅ Dashboard tác giả với danh sách bài đã nộp
- ✅ Chỉnh sửa và cập nhật bài nộp

#### 👥 Quản Lý Người Dùng (User Management)
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập với JWT Authentication
- ✅ Phân quyền role-based: Admin, Chair, Author, Reviewer
- ✅ Quản lý profile người dùng
- ✅ Forgot Password & Reset Password
- ✅ Audit logging cho các hành động quan trọng

#### 🎨 Giao Diện Người Dùng (Frontend)
- ✅ **React Router** với URL routing đầy đủ
- ✅ Responsive design với **TailwindCSS**
- ✅ Dark mode support
- ✅ Navbar với navigation động theo role
- ✅ Trang chủ với hero section và danh sách hội nghị
- ✅ Trang danh sách hội nghị (Conference List)
- ✅ Trang chi tiết hội nghị (Conference Details)
- ✅ **Trang Call for Papers** hiển thị tất cả hội nghị đang nhận bài
- ✅ Dashboard riêng cho từng role (Author, Chair, Reviewer, Admin)
- ✅ Form submission với validation
- ✅ Loading states và error handling

#### 🔐 Bảo Mật & Xác Thực
- ✅ JWT Authentication với Refresh Token
- ✅ Role-Based Access Control (RBAC)
- ✅ Protected routes theo permission
- ✅ API Gateway với Ocelot
- ✅ CORS configuration
- ✅ Password hashing với BCrypt

#### 🗄️ Database & Storage
- ✅ PostgreSQL với 6 database schemas
- ✅ Entity Framework Core với Code-First Migrations
- ✅ Repository Pattern
- ✅ Redis caching
- ✅ SQL initialization scripts

#### 🚀 DevOps & Deployment
- ✅ Docker & Docker Compose
- ✅ Multi-stage Dockerfile cho Frontend và Backend
- ✅ Environment-based configuration
- ✅ Logging với Serilog
- ✅ Health checks

#### 📢 Review & Notifications (Mới)
- ✅ Hệ thống phân công Reviewer
- ✅ Quy trình đánh giá & quyết định (Accept/Reject)
- ✅ Notification Service với Email & Real-time (SignalR)

### 🔄 Chức Năng Đang Phát Triển
- 🔄 AI Service (reviewer matching, spell check)
- 🔄 Camera-ready submission
- 🔄 Export proceedings

---

## 🏗️ Kiến Trúc Microservices

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (React + Vite) - Port 3000            │
│      TypeScript | TailwindCSS | React Router           │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼─────────────────────────────────┐
│         API Gateway (Ocelot) - Port 5000              │
│           JWT Validation | Routing | CORS             │
└─┬──────┬──────┬──────┬──────┬──────────────────────┬──┘
  │      │      │      │      │                      │
┌─▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐         ┌────▼────┐
│Iden││Conf ││Subm ││Rev  ││Noti││ AI │         │PostgreSQL│
│5001││5002 ││5003 ││5004 ││5005││8000│◄────────┤  + Redis │
└────┘└─────┘└─────┘└─────┘└─────┘└─────┘         └─────────┘
   ▲      ▲      ▲      ▲      ▲      ▲
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
┌───────────────────────────────────────┐
│              RabbitMQ                 │
│           (Event Bus)                 │
└───────────────────────────────────────┘
   │
   ▼
┌──────────────┐
│ Apache Kafka │
│ (Audit Logs) │
└──────────────┘
```

### Microservices

| Service | Port | Mô Tả |
|---------|------|-------|
| **Identity** | 5001 | User authentication, RBAC, SSO |
| **Conference** | 5002 | Conference management, CFP, tracks |
| **Submission** | 5003 | Paper submissions, file management |
| **Review** | 5004 | Review assignments, decisions |
| **Notification** | 5005 | Email & in-app notifications |
| **AI Service** | 8000 | Python AI Service (NLP, Suggestions) |
| **API Gateway** | 5000 | Routing, authentication |
| **Frontend** | 3000 | React web application |

---

## 🚀 Quick Start

### Yêu Cầu Hệ Thống

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+ & npm](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [PostgreSQL 15+](https://www.postgresql.org/) (hoặc dùng Docker)
- [Redis 7+](https://redis.io/) (hoặc dùng Docker)
- Git

### 🐳 Deploy với Docker Compose (Khuyến nghị)

```bash
# Clone repository
git clone https://github.com/your-org/UTH-Scientific-Conference-Paper-Management-System.git
cd UTH-Scientific-Conference-Paper-Management-System

# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop và xóa volumes
docker-compose down -v
```

**Services sẽ chạy tại:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- Identity Service: http://localhost:5001
- Conference Service: http://localhost:5002
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### ⚙️ Cấu Hình Environment Variables

Tạo file `.env` trong thư mục gốc:

```env
# Database Configuration
POSTGRES_USER=confms_admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=uth_confms
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=UTH_CONFMS_JWT_SECRET_KEY_2026_CHANGE_IN_PRODUCTION_USE_LONG_RANDOM_STRING
JWT_ISSUER=uth-confms-identity
JWT_AUDIENCE=uth-confms-services
JWT_EXPIRATION_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRATION_DAYS=7

# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@uth-confms.edu.vn
SMTP_FROM_NAME=UTH Conference Management System

# API Gateway Configuration
API_GATEWAY_URL=http://localhost:5000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SITE_NAME=UTH Conference Management System

# RabbitMQ Configuration
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# AI Service Configuration (Optional)
AI_SERVICE_ENABLED=false
AI_SERVICE_URL=http://ai-service:8000

# File Upload Configuration
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_EXTENSIONS=.pdf,.doc,.docx

# Application Settings
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:80
```

### 🔧 Chạy Từng Service Riêng Lẻ (Development)

#### 1. Khởi động Database

```bash
# Start PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_USER=confms_admin \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=uth_confms \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Import database schemas
psql -h localhost -U confms_admin -d uth_confms -f database/01_identity_schema.sql
psql -h localhost -U confms_admin -d uth_confms -f database/02_conference_schema.sql
# ... (import các file schema khác)
```

#### 2. Chạy Backend Services

```bash
# Identity Service
cd UTH-ConfMS-Backend/Services/Identity.Service
dotnet restore
dotnet run

# Conference Service
cd ../Conference.Service
dotnet restore
dotnet run

# Tương tự cho các service khác...
```

#### 3. Chạy API Gateway

```bash
cd UTH-ConfMS-Backend/ApiGateway
dotnet restore
dotnet run
```

#### 4. Chạy Frontend

```bash
cd UTH-ConfMS-Frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173 (Vite dev server)

### 🗄️ Khởi Tạo Database

```bash
# Kết nối PostgreSQL
psql -h localhost -U confms_admin -d uth_confms

# Chạy initialization scripts
\i database/01_identity_schema.sql
\i database/02_conference_schema.sql
\i database/03_submission_schema.sql
\i database/04_review_schema.sql
\i database/05_notification_schema.sql
\i database/06_admin_schema.sql

# Kiểm tra tables
\dt

# Thoát
\q
```

### 🔑 Default Admin Account

```
Email: admin@uth.edu.vn
Password: Admin@123456
```

---

## 📂 Cấu Trúc Dự Án

```
UTH-Scientific-Conference-Paper-Management-System/
│
├── 📄 docker-compose.yml                # Docker Compose configuration
├── 📄 README.md                         # Documentation (this file)
├── 📄 .env.example                      # Environment variables template
│
├── 📂 database/                         # PostgreSQL initialization scripts
│   ├── 01_identity_schema.sql           # Users, Roles, Permissions
│   ├── 02_conference_schema.sql         # Conferences, Tracks, CFP
│   ├── 03_submission_schema.sql         # Papers, Authors, Files
│   ├── 04_review_schema.sql             # Reviews, Assignments, Decisions
│   ├── 05_notification_schema.sql       # Notifications, Email logs
│   └── 06_admin_schema.sql              # System configs, Audit logs
│
├── 📂 UTH-ConfMS-Backend/               # .NET Backend Services
│   │
│   ├── 📂 ApiGateway/                   # Ocelot API Gateway (Port 5000)
│   │   ├── Program.cs
│   │   ├── ocelot.json                  # Gateway routing configuration
│   │   ├── appsettings.json
│   │   └── Dockerfile
│   │
│   ├── 📂 Services/
│   │   │
│   │   ├── 📂 Identity.Service/         # Authentication & Authorization (Port 5001)
│   │   │   ├── Controllers/             # AuthController, UsersController
│   │   │   ├── Data/                    # IdentityDbContext
│   │   │   ├── DTOs/                    # LoginDto, RegisterDto, UserDto
│   │   │   ├── Entities/                # User, Role, Permission
│   │   │   ├── Interfaces/              # IAuthService, IUserRepository
│   │   │   ├── Mappings/                # AutoMapper profiles
│   │   │   ├── Repositories/            # UserRepository, RoleRepository
│   │   │   ├── Services/                # AuthService, TokenService
│   │   │   ├── Validators/              # FluentValidation rules
│   │   │   ├── Program.cs
│   │   │   ├── appsettings.json
│   │   │   └── Dockerfile
│   │   │
│   │   ├── 📂 Conference.Service/       # Conference Management (Port 5002)
│   │   │   ├── Controllers/             # ConferencesController, TracksController, CFPController
│   │   │   ├── Data/                    # ConferenceDbContext
│   │   │   ├── DTOs/                    # ConferenceDto, TrackDto, CFPDto
│   │   │   ├── Entities/                # Conference, Track, CallForPapers
│   │   │   ├── Services/                # ConferenceService, TrackService
│   │   │   ├── Program.cs
│   │   │   └── Dockerfile
│   │   │
│   │   ├── 📂 Submission.Service/       # Paper Submissions (Port 5003)
│   │   │   ├── Controllers/             # SubmissionsController, AuthorsController
│   │   │   ├── Data/                    # SubmissionDbContext
│   │   │   ├── Entities/                # Submission, Author, SubmissionFile
│   │   │   ├── Services/                # SubmissionService, FileService
│   │   │   └── Dockerfile
│   │   │
│   │   ├── 📂 Review.Service/           # Review Management (Port 5004)
│   │   │   ├── Controllers/             # ReviewsController, AssignmentsController
│   │   │   ├── Entities/                # Review, ReviewAssignment, Decision
│   │   │   └── Dockerfile
│   │   │
│   │   ├── 📂 Notification.Service/     # Notifications (Port 5005)
│   │   │   ├── Controllers/             # NotificationsController
│   │   │   ├── Services/                # EmailService, NotificationService
│   │   │   └── Dockerfile
│   │   │
│   │   └── 📂 AI.Service/               # Python AI Service (Port 8000)
│   │       ├── main.py                  # FastAPI application
│   │       ├── models.py                # Pydantic models
│   │       ├── requirements.txt         # Python dependencies
│   │       └── Dockerfile
│   │
│   └── 📂 Shared/
│       └── 📂 UTH.ConfMS.Shared/        # Shared library (NuGet package)
│           ├── Constants/               # Shared constants
│           ├── Models/                  # Shared models/DTOs
│           └── UTH.ConfMS.Shared.csproj
│
├── 📂 UTH-ConfMS-Frontend/              # React Frontend
│   ├── Dockerfile
│   ├── nginx.conf                       # Nginx configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                   # Vite configuration
│   ├── index.html
│   │
│   ├── 📂 public/
│   │   └── locales/                     # i18n translations
│   │
│   └── 📂 src/
│       ├── App.tsx                      # Main app with React Router
│       ├── index.tsx                    # Entry point
│       ├── vite-env.d.ts
│       │
│       ├── 📂 assets/                   # Images, fonts, static files
│       │
│       ├── 📂 components/               # Reusable React components
│       │   ├── Navbar.tsx               # Navigation bar
│       │   ├── Footer.tsx
│       │   ├── ConferenceDetails.tsx
│       │   ├── CallForPapers.tsx        # CFP display (list & detail)
│       │   └── ...
│       │
│       ├── 📂 contexts/                 # React Context
│       │   └── AuthContext.tsx          # Authentication state
│       │
│       ├── 📂 pages/                    # Page components
│       │   ├── 📂 Auth/                 # Authentication pages
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   └── ForgotPassword.tsx
│       │   │
│       │   ├── 📂 Public/               # Public pages
│       │   │   ├── Home.tsx
│       │   │   ├── Hero.tsx
│       │   │   ├── ConferenceList.tsx
│       │   │   └── AboutUs.tsx
│       │   │
│       │   ├── 📂 Author/               # Author dashboard
│       │   │   ├── Dashboard.tsx
│       │   │   ├── SubmitPaper.tsx
│       │   │   └── PaperDetail.tsx
│       │   │
│       │   ├── 📂 Chair/                # Chair dashboard
│       │   │   ├── Dashboard.tsx
│       │   │   ├── CreateConference.tsx
│       │   │   ├── ConferenceSettings.tsx
│       │   │   ├── CFPManagement.tsx
│       │   │   ├── PCManagement.tsx
│       │   │   └── SubmissionManagement.tsx
│       │   │
│       │   ├── 📂 Reviewer/             # Reviewer dashboard
│       │   │   └── Dashboard.tsx
│       │   │
│       │   └── 📂 Admin/                # Admin dashboard
│       │       ├── Dashboard.tsx
│       │       ├── UserManagement.tsx
│       │       └── SystemConfig.tsx
│       │
│       └── 📂 services/                 # API services
│           ├── apiClient.ts             # Axios instance with interceptors
│           ├── authApi.ts               # Authentication API calls
│           ├── conferenceApi.ts         # Conference API calls
│           ├── submissionApi.ts         # Submission API calls
│           └── admin.ts                 # Admin API calls
│
└── 📂 UTH-ConfMS-Docs/                  # Documentation
    └── README.md
```

---

## 🔧 Services & Ports

| Service | Port | Technology | Purpose | Status |
|---------|------|------------|---------|--------|
| **Frontend** | 3000 | React 18 + Vite | Web UI | ✅ Running |
| **API Gateway** | 5000 | Ocelot | Request routing | ✅ Running |
| **Identity Service** | 5001 | .NET 8 | Authentication | ✅ Running |
| **Conference Service** | 5002 | .NET 8 | Conference management | ✅ Running |
| **Submission Service** | 5003 | .NET 8 | Paper submissions | ✅ Running |
| **Review Service** | 5004 | .NET 8 | Review workflow | ✅ Running |
| **Notification Service** | 5005 | .NET 8 | Email & notifications | ✅ Running |
| **AI Service** | 8000 | Python + FastAPI | NLP, recommendations | 🔄 Optional |
| **PostgreSQL** | 5432 | PostgreSQL 15 | Primary database | ✅ Running |
| **Redis** | 6379 | Redis 7 | Caching | ✅ Running |
| **RabbitMQ** | 5672 | RabbitMQ 3.12 | Message broker | ✅ Running |
| **RabbitMQ Management** | 15672 | Web UI | Queue management | ✅ Running |

### 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:5000
- **Swagger UI**: 
  - Identity: http://localhost:5001/swagger
  - Conference: http://localhost:5002/swagger
  - Submission: http://localhost:5003/swagger
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Database**: localhost:5432 (confms_admin/password)

---

## 🔄 API Endpoints

### Authentication & Users
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Register new user
POST   /api/auth/refresh-token      # Refresh JWT token
POST   /api/auth/forgot-password    # Request password reset
GET    /api/users/profile           # Get user profile
PUT    /api/users/profile           # Update profile
```

### Conferences
```
GET    /api/conferences             # List all conferences
GET    /api/conferences/{id}        # Get conference details
POST   /api/conferences             # Create conference (Chair only)
PUT    /api/conferences/{id}        # Update conference
DELETE /api/conferences/{id}        # Delete conference

GET    /api/conferences/{id}/tracks         # List tracks
POST   /api/conferences/{id}/tracks         # Create track
DELETE /api/conferences/{id}/tracks/{trackId} # Delete track

GET    /api/conferences/{id}/cfp    # Get Call for Papers
POST   /api/conferences/{id}/cfp    # Create/Update CFP
```

### Submissions
```
GET    /api/submissions             # List user's submissions
GET    /api/submissions/{id}        # Get submission details
POST   /api/submissions             # Submit new paper
PUT    /api/submissions/{id}        # Update submission
DELETE /api/submissions/{id}        # Delete submission
POST   /api/submissions/{id}/files  # Upload paper file
```

### Reviews (In Progress)
```
GET    /api/reviews                 # List assigned reviews
GET    /api/reviews/{id}            # Get review details
POST   /api/reviews                 # Submit review
PUT    /api/reviews/{id}            # Update review
GET    /api/reviews/assignments     # Get reviewer assignments
```

---

## 🎭 User Roles & Permissions

| Role | Permissions | UI Features |
|------|-------------|-------------|
| **Admin** | • Full system access<br>• User management<br>• System configuration<br>• View all conferences | • Admin Dashboard<br>• User Management<br>• System Settings<br>• Audit Logs |
| **Chair** | • Create conferences<br>• Manage CFP<br>• Configure tracks<br>• Assign reviewers<br>• Make decisions | • Chair Dashboard<br>• Create Conference<br>• Conference Settings<br>• CFP Management<br>• PC Management<br>• Submission Management |
| **Author** | • Submit papers<br>• View submission status<br>• Upload revisions<br>• Respond to reviews | • Author Dashboard<br>• Submit Paper<br>• My Submissions<br>• Paper Details<br>• Notifications |
| **Reviewer** | • View assigned papers<br>• Submit reviews<br>• Participate in discussions<br>• Update expertise | • Reviewer Dashboard<br>• My Reviews<br>• Review Form<br>• Discussion Board |
| **Public** | • View conference list<br>• Read CFP<br>• Register account | • Home<br>• Conference List<br>• Call for Papers<br>• Login/Register |

---

## 🔄 Luồng hoạt động của hệ thống

### Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (:3000)                                │
│                       React + Material-UI                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (:5000)                              │
│                         Ocelot Routing                                  │
└────┬────────┬────────┬────────┬────────┬────────────────────────────────┘
     │        │        │        │        │
     ▼        ▼        ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Identity││Conferen││Submissi││ Review ││Notifica│
│ :5001  ││ :5002  ││ :5003  ││ :5004  ││ :5005  │
└───┬────┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘
    │         │         │         │         │
    └─────────┴─────────┴────┬────┴─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │PostgreSQL│   │  Redis   │   │  Shared  │
       │  :5432   │   │  :6379   │   │  Library │
       └──────────┘   └──────────┘   └──────────┘
```

### Luồng 1: Đăng ký & Đăng nhập (Authentication)

```
User ──▶ Frontend ──▶ API Gateway ──▶ Identity Service ──▶ PostgreSQL
                                            │
                                            ▼
                                         Redis (session)
```

**Các bước:**
1. User nhập email/password trên Frontend
2. Frontend gọi `POST /api/auth/login` qua API Gateway
3. Gateway route đến Identity.Service
4. Identity.Service kiểm tra credentials, tạo JWT Token
5. Frontend lưu token, các request tiếp theo gửi kèm `Authorization: Bearer <token>`

### Luồng 2: Nộp bài báo (Paper Submission)

```
Author ──▶ Frontend ──▶ Gateway ──▶ Submission Service ──▶ PostgreSQL
              │                           │
              │                           ▼
              │                      File Storage
              │                           │
              └───────────────────────────┼──────▶ Notification Service
                                          │              │
                                          │              ▼
                                          │        Email (confirm)
```

**Các bước:**
1. Author upload PDF và điền thông tin bài báo
2. Submission.Service validate, lưu file, tạo record
3. Notification.Service gửi email xác nhận

### Luồng 3: Quá trình Review

```
Chair ──▶ Frontend ──▶ Gateway ──▶ Review Service ──▶ PostgreSQL
                                        │
                                        ├──▶ Submission Service (get paper)
                                        │
                                        └──▶ Notification Service (notify reviewer)
                                                      │
                                                      ▼
Reviewer ◀─────────────────────────────────── Email Invitation
    │
    └──▶ Frontend ──▶ Gateway ──▶ Review Service (submit review)
```

**Các bước:**
1. Chair assign reviewer cho submission
2. Review.Service kiểm tra Conflict of Interest
3. Notification.Service gửi email mời reviewer
4. Reviewer đọc paper, submit review với điểm số
5. Chair xem reviews, đưa ra quyết định Accept/Reject

### Luồng 4: State Machine - Submission Status

```
┌─────────┐
│  DRAFT  │
└────┬────┘
     │ submit
     ▼
┌──────────┐
│SUBMITTED │
└────┬─────┘
     │ assign reviewers
     ▼
┌────────────────┐
│ UNDER_REVIEW   │
└───────┬────────┘
        │ all reviews completed
        ▼
┌───────┴───────┬──────────────┐
│               │              │
▼               ▼              ▼
ACCEPTED    REJECTED    REVISION_REQUIRED
                              │
                              │ submit revision
                              ▼
                        UNDER_REVIEW (again)
```

### Luồng 5: Authentication Flow (JWT)

```
Frontend                Gateway                    Backend Service
   │                       │                             │
   │  Request + JWT Token  │                             │
   │──────────────────────▶│                             │
   │                       │  Validate JWT               │
   │                       │  (signature, expiry)        │
   │                       │────────────────────────────▶│
   │                       │         Response            │
   │      Response         │◀────────────────────────────│
   │◀──────────────────────│                             │
```

---

## 🎭 Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Quản lý toàn hệ thống, users, system configs |
| **Chair** | Tạo/quản lý conference, assign reviewers, quyết định accept/reject |
| **Reviewer** | Xem submissions được assign, submit reviews |
| **Author** | Submit papers, xem reviews, submit rebuttals |
| **Attendee** | Đăng ký tham dự, xem accepted papers |

---

## 🗄️ Database Schema Hiện Tại

Hệ thống sử dụng **PostgreSQL 15+** với 6 database schemas. Dưới đây là cấu trúc database thực tế đang được sử dụng:

---

### 1️⃣ **Identity Service** (`01_identity_schema.sql`)

#### 📋 Tables

**`users`** - Thông tin người dùng
```sql
user_id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
username VARCHAR(100) NOT NULL
password_hash VARCHAR(500) NOT NULL
full_name VARCHAR(200) NOT NULL
affiliation VARCHAR(255)          -- Tổ chức/Trường
department VARCHAR(255)            -- Khoa/Bộ môn
title VARCHAR(100)                 -- Chức danh (Dr., Prof., etc.)
country VARCHAR(100)
phone VARCHAR(20)
orcid VARCHAR(50)                  -- ORCID ID
google_scholar_id VARCHAR(100)
bio TEXT
profile_picture_url VARCHAR(500)
password_reset_token VARCHAR(255)
password_reset_expires TIMESTAMP
last_login_at TIMESTAMP
last_login_ip VARCHAR(45)
login_count INT DEFAULT 0
failed_login_attempts INT DEFAULT 0
account_locked_until TIMESTAMP
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**`roles`** - Vai trò hệ thống
```sql
role_id UUID PRIMARY KEY
role_name VARCHAR(100) UNIQUE      -- SYSTEM_ADMIN, CONFERENCE_CHAIR, REVIEWER, AUTHOR
display_name VARCHAR(255)
description TEXT
is_system_role BOOLEAN             -- Role hệ thống không thể xóa
role_level VARCHAR(50)             -- SYSTEM, CONFERENCE
is_active BOOLEAN DEFAULT TRUE
```

**Roles mặc định:**
- `SYSTEM_ADMIN` - Quản trị hệ thống
- `CONFERENCE_CHAIR` - Chủ tịch hội nghị
- `REVIEWER` - Phản biện viên
- `AUTHOR` - Tác giả

**`user_roles`** - Phân quyền người dùng
```sql
user_role_id UUID PRIMARY KEY
user_id UUID → users(user_id)
role_id UUID → roles(role_id)
conference_id UUID                 -- NULL = role toàn hệ thống
track_id UUID                      -- NULL = role toàn conference
is_active BOOLEAN DEFAULT TRUE
expires_at TIMESTAMP               -- Role tạm thời
assigned_by UUID
assigned_at TIMESTAMP
UNIQUE (user_id, role_id, conference_id)
```

**`refresh_tokens`** - JWT Refresh Tokens
```sql
token_id UUID PRIMARY KEY
user_id UUID → users(user_id)
token VARCHAR(500) UNIQUE NOT NULL
expires_at TIMESTAMP NOT NULL
created_at TIMESTAMP
revoked_at TIMESTAMP
revoked_by_ip VARCHAR(45)
replaced_by_token VARCHAR(500)
created_by_ip VARCHAR(45)
```

**`audit_logs`** - Nhật ký hành động
```sql
id UUID PRIMARY KEY
user_id UUID → users(user_id)
action VARCHAR(100) NOT NULL       -- LOGIN, CREATE_CONFERENCE, SUBMIT_PAPER
entity_type VARCHAR(100)           -- USER, CONFERENCE, SUBMISSION
entity_id UUID
details JSONB
ip_address VARCHAR(45)
user_agent TEXT
created_at TIMESTAMP
```

---

### 2️⃣ **Conference Service** (`02_conference_schema.sql`)

#### 📋 Tables

**`conferences`** - Thông tin hội nghị
```sql
conference_id UUID PRIMARY KEY
name VARCHAR(255) NOT NULL
acronym VARCHAR(20) UNIQUE NOT NULL
description TEXT
location VARCHAR(255)
start_date DATE
end_date DATE
submission_deadline TIMESTAMP
notification_date TIMESTAMP
camera_ready_deadline TIMESTAMP
review_mode VARCHAR(50)            -- DOUBLE_BLIND, SINGLE_BLIND
status VARCHAR(50)                 -- DRAFT, ACTIVE, COMPLETED
visibility VARCHAR(50)             -- PRIVATE, PUBLIC
created_by UUID
created_at TIMESTAMP
updated_at TIMESTAMP
```

**`conference_tracks`** - Chuyên ngành/Track
```sql
track_id UUID PRIMARY KEY
conference_id UUID → conferences(conference_id)
name VARCHAR(200) NOT NULL
created_at TIMESTAMP
```

**`conference_topics`** - Chủ đề nghiên cứu
```sql
topic_id UUID PRIMARY KEY
conference_id UUID → conferences(conference_id)
name VARCHAR(300) NOT NULL
created_at TIMESTAMP
```

**`committee_members`** - Ban tổ chức & PC
```sql
member_id UUID PRIMARY KEY
conference_id UUID → conferences(conference_id)
user_id UUID (references users)
role VARCHAR(50)                   -- CHAIR, PC_MEMBER, REVIEWER
created_at TIMESTAMP
UNIQUE (conference_id, user_id, role)
```

**`call_for_papers`** - Kêu gọi bài báo
```sql
cfp_id UUID PRIMARY KEY
conference_id UUID → conferences(conference_id)
title VARCHAR(500) NOT NULL
content TEXT
submission_guidelines TEXT
formatting_requirements TEXT
accepted_file_formats VARCHAR(100) -- PDF, DOCX
max_file_size_mb INTEGER DEFAULT 10
min_pages INTEGER
max_pages INTEGER
is_published BOOLEAN DEFAULT FALSE
published_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

### 3️⃣ **Submission Service** (`03_submission_schema.sql`)

#### 📋 Tables

**`submissions`** - Bài báo nộp
```sql
id UUID PRIMARY KEY
conference_id UUID (references conferences)
track_id UUID (references tracks)
paper_number INT
title VARCHAR(500) NOT NULL
abstract TEXT NOT NULL
status VARCHAR(20)                 -- DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED
submitted_by UUID (references users)
submitted_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

**`submission_authors`** - Tác giả
```sql
author_id UUID PRIMARY KEY
submission_id UUID → submissions(id)
user_id UUID (references users - optional)
full_name VARCHAR(200) NOT NULL
email VARCHAR(255) NOT NULL
affiliation VARCHAR(255)
is_corresponding BOOLEAN           -- Tác giả liên hệ
author_order INT NOT NULL          -- Thứ tự tác giả
created_at TIMESTAMP
```

**`submission_files`** - File đính kèm
```sql
id UUID PRIMARY KEY
submission_id UUID → submissions(id)
file_name VARCHAR(255) NOT NULL
file_path VARCHAR(500) NOT NULL
file_size BIGINT NOT NULL
file_type VARCHAR(50)              -- PDF, DOCX
is_main_paper BOOLEAN DEFAULT TRUE
uploaded_by UUID
uploaded_at TIMESTAMP
```

---

### 4️⃣ **Review Service** (`04_review_schema.sql`)

#### 📋 Tables

**`review_assignments`** - Phân công phản biện
```sql
id UUID PRIMARY KEY
submission_id UUID (references submissions)
reviewer_id UUID (references users)
assigned_by UUID
assigned_at TIMESTAMP
deadline TIMESTAMP NOT NULL
status VARCHAR(20)                 -- PENDING, ACCEPTED, DECLINED, COMPLETED
created_at TIMESTAMP
```

**`reviews`** - Đánh giá phản biện
```sql
id UUID PRIMARY KEY
assignment_id UUID → review_assignments(id)
overall_score INT NOT NULL         -- 1-10
confidence INT NOT NULL            -- 1-5 (mức độ tự tin)
recommendation VARCHAR(50)         -- ACCEPT, REJECT, MAJOR_REVISION, MINOR_REVISION
comments TEXT NOT NULL
submitted_at TIMESTAMP
updated_at TIMESTAMP
```

**`review_scores`** - Điểm chi tiết theo tiêu chí
```sql
id UUID PRIMARY KEY
review_id UUID → reviews(id)
criteria_name VARCHAR(100)         -- Originality, Quality, Clarity
score INT NOT NULL
max_score INT DEFAULT 10
created_at TIMESTAMP
```

**`decisions`** - Quyết định cuối cùng
```sql
id UUID PRIMARY KEY
submission_id UUID (references submissions)
decision_type VARCHAR(50)          -- ACCEPT, REJECT, MAJOR_REVISION, MINOR_REVISION
decision_by UUID (references users - Chair)
decision_date TIMESTAMP
comments TEXT
is_final BOOLEAN DEFAULT TRUE
```

**`conflicts_of_interest`** - Xung đột lợi ích
```sql
id UUID PRIMARY KEY
submission_id UUID
reviewer_id UUID
conflict_type VARCHAR(50)          -- COAUTHOR, ADVISOR, INSTITUTION
created_at TIMESTAMP
UNIQUE (submission_id, reviewer_id)
```

---

### 5️⃣ **Notification Service** (`05_notification_schema.sql`)

#### 📋 Tables

**`notifications`** - Thông báo trong app
```sql
id UUID PRIMARY KEY
user_id UUID (references users)
type VARCHAR(50)                   -- SUBMISSION, REVIEW, DECISION, SYSTEM
title VARCHAR(255) NOT NULL
message TEXT NOT NULL
is_read BOOLEAN DEFAULT FALSE
action_url VARCHAR(500)
created_at TIMESTAMP
```

**`email_queue`** - Hàng đợi email
```sql
id UUID PRIMARY KEY
to_email VARCHAR(255) NOT NULL
subject VARCHAR(500) NOT NULL
body TEXT NOT NULL
status VARCHAR(20)                 -- PENDING, SENT, FAILED
sent_at TIMESTAMP
error_message TEXT
retry_count INT DEFAULT 0
created_at TIMESTAMP
```

**`email_templates`** - Mẫu email
```sql
id UUID PRIMARY KEY
name VARCHAR(100) UNIQUE NOT NULL
subject VARCHAR(500) NOT NULL
body_template TEXT NOT NULL        -- Có thể dùng placeholders: {{name}}, {{conference}}
template_type VARCHAR(50)          -- SUBMISSION, REVIEW, DECISION
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

### 6️⃣ **Admin Service** (`06_admin_schema.sql`)

#### 📋 Tables

**`system_settings`** - Cấu hình hệ thống
```sql
id UUID PRIMARY KEY
category VARCHAR(100) NOT NULL     -- EMAIL, STORAGE, SECURITY
setting_key VARCHAR(150) UNIQUE NOT NULL
setting_value TEXT NOT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Default settings:**
```sql
('EMAIL', 'smtp_host', 'smtp.gmail.com')
('EMAIL', 'smtp_port', '587')
('EMAIL', 'from_email', 'noreply@uth-confms.vn')
('STORAGE', 'storage_path', '/uploads')
('STORAGE', 'max_file_size_mb', '10')
```

**`system_logs`** - Log hệ thống
```sql
id UUID PRIMARY KEY
log_level VARCHAR(20)              -- INFO, WARNING, ERROR
service_name VARCHAR(100) NOT NULL -- Identity, Conference, Submission, etc.
message TEXT NOT NULL
created_at TIMESTAMP
```

### 📝 Database Initialization

```bash
# Connect to PostgreSQL
psql -h localhost -U confms_admin -d uth_confms

# Import schemas in order
\i database/01_identity_schema.sql
\i database/02_conference_schema.sql
\i database/03_submission_schema.sql
\i database/04_review_schema.sql
\i database/05_notification_schema.sql
\i database/06_admin_schema.sql

# Verify tables
\dt

# Check specific schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## � Security Features

- ✅ **JWT Authentication** với Refresh Tokens
- ✅ **Password Hashing** với BCrypt (cost factor 12)
- ✅ **Role-Based Access Control** (RBAC)
- ✅ **Conference-scoped Permissions**
- ✅ **API Gateway** với centralized authentication
- ✅ **CORS Configuration** cho cross-origin requests
- ✅ **Input Validation** với FluentValidation
- ✅ **SQL Injection Protection** với parameterized queries
- ✅ **XSS Protection** với input sanitization
- ✅ **Rate Limiting** để ngăn chặn abuse
- ✅ **Audit Logging** cho tất cả critical operations
- 🔄 **Double-blind Review** mode (in progress)
- 🔄 **Conflict of Interest Detection** (in progress)
- 🔄 **HTTPS/TLS** support (production ready)

---

## 🔄 Workflow & State Machines

### 📄 Submission Status Flow

```
┌─────────┐
│  DRAFT  │ ◄──── Author creates submission
└────┬────┘
     │ submit()
     ▼
┌──────────┐
│SUBMITTED │ ◄──── Paper awaiting review
└────┬─────┘
     │ assign_reviewers()
     ▼
┌────────────────┐
│ UNDER_REVIEW   │ ◄──── Reviewers evaluating
└────────┬───────┘
         │ all_reviews_completed()
         ▼
    ┌────┴────┐
    │ DECIDE  │ ◄──── Chair makes decision
    └────┬────┘
         │
    ┌────┴────────────┬──────────────┐
    │                 │              │
    ▼                 ▼              ▼
┌─────────┐    ┌──────────┐   ┌──────────────────┐
│ACCEPTED │    │ REJECTED │   │REVISION_REQUIRED │
└─────────┘    └──────────┘   └────────┬─────────┘
                                        │ submit_revision()
                                        ▼
                                 UNDER_REVIEW (loop)
```

### 👥 Review Assignment Flow

```
Chair ──▶ Select Submission
          │
          ▼
    Check Available Reviewers
          │
          ├──▶ Filter by COI ──▶ Remove conflicted reviewers
          │
          ├──▶ Filter by Load ──▶ Remove overloaded reviewers
          │
          ├──▶ AI Matching ──▶ Sort by relevance (optional)
          │
          ▼
    Assign Reviewers (typically 3-5)
          │
          ▼
    Send Email Invitations
          │
          ▼
    Reviewers Accept/Decline
          │
          ▼
    Reviewers Submit Reviews
          │
          ▼
    Chair Reads Reviews
          │
          ▼
    Make Decision
```

---

### Test Accounts

```
# Admin
Email: admin@uth.edu.vn
Password: Admin@123456

# Chair
Email: chair@uth.edu.vn
Password: Chair@123456

# Author
Email: author@uth.edu.vn
Password: Author@123456

# Reviewer
Email: reviewer@uth.edu.vn
Password: Reviewer@123456
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- **Backend**: Follow C# coding conventions
- **Frontend**: ESLint + Prettier configuration
- **Commits**: Conventional Commits format

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Hệ thống được phát triển với mục đích:
- ✅ Quản lý hội nghị khoa học chuyên nghiệp
- ✅ Hỗ trợ quy trình peer review minh bạch
- ✅ Tăng tính công bằng trong đánh giá
- ✅ Tiết kiệm chi phí so với giải pháp thương mại (EasyChair, ConfTool, OpenConf)
- ✅ Phù hợp với chuẩn quốc tế

### Built With
- [ASP.NET Core](https://dotnet.microsoft.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching
- [Docker](https://www.docker.com/) - Containerization
- [Ocelot](https://github.com/ThreeMammals/Ocelot) - API Gateway
- [Vite](https://vitejs.dev/) - Frontend build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

## 📞 Support & Contact

- **Email**: support@uth-confms.edu.vn
- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/UTH-ConfMS/issues)
- **Documentation**: [Wiki](https://github.com/your-org/UTH-ConfMS/wiki)

---

**Made with ❤️ for Academic Research Community**

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Active Development 🚀