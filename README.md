# Quick Score Entry - Hệ thống Quản Lý Sinh Viên & Nhập Điểm

Ứng dụng web hiện đại dành cho giảng viên, cung cấp giải pháp toàn diện để quản lý lớp học, sinh viên và điểm số với tích hợp máy scan tự động thông minh.

## 🚀 Cài đặt và Chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd quick-score-entry
```

### 2. Cài đặt dependencies

```bash
yarn install
```

### 3. Chạy ứng dụng

```bash
yarn dev
```

Truy cập: `http://localhost:5173`

## 📦 Deploy trên Vercel

### 1. Kết nối repository với Vercel

- Đăng nhập vào [Vercel](https://vercel.com)
- Import repository từ GitHub

### 2. Cấu hình Environment Variables trên Vercel

- Vào Project Settings → Environment Variables
- Thêm tất cả các biến `VITE_FIREBASE_*` từ file `.env`

### 3. Deploy

```bash
# Build local để test trước
npm run build

# Push code lên GitHub (Vercel sẽ tự động deploy)
git add .
git commit -m "Fixed deployment issues"
git push origin main
```

## ✨ Tính năng chính

### 🔐 Hệ thống xác thực

- **Đăng ký tài khoản**: Tạo tài khoản mới với Firebase Authentication
- **Đăng nhập bảo mật**: Xác thực email/password qua Firebase
- **Quản lý phiên**: Tự động duy trì trạng thái đăng nhập
- **Đổi mật khẩu**: Cập nhật mật khẩu an toàn

### 📚 Quản lý lớp học toàn diện

- **Dashboard tổng quan**: Hiển thị thống kê tổng số lớp, sinh viên
- **Danh sách lớp học**: Xem tất cả lớp với thông tin chi tiết
- **Tạo lớp mới**: Thêm lớp học với tên, học kỳ, giảng viên
- **Chỉnh sửa lớp**: Cập nhật thông tin lớp học
- **Xóa lớp**: Xóa lớp với xác nhận an toàn
- **Thống kê lớp**: Số sinh viên, số bài kiểm tra

### � Quản lý sinh viên thông minh

- **Danh sách sinh viên**: Hiển thị tất cả sinh viên trong hệ thống
- **Thêm sinh viên**: Tạo hồ sơ sinh viên với thông tin đầy đủ
- **Chỉnh sửa thông tin**: Cập nhật MSSV, họ tên, email, số điện thoại
- **Xóa sinh viên**: Xóa an toàn với xác nhận
- **Đăng ký lớp học**: Thêm/bỏ sinh viên khỏi lớp
- **Tìm kiếm nhanh**: Tìm sinh viên theo tên, MSSV

### 📊 Quản lý điểm số và bài kiểm tra

- **Tích hợp máy scan**: Nhận kết quả từ máy scan tự động realtime
- **Nhập điểm thủ công**: Thêm điểm bằng tay khi cần thiết
- **Chỉnh sửa kết quả**: Sửa thông tin và điểm số đã scan
- **Xem ảnh bài thi**: Preview ảnh bài làm từ máy scan
- **Tạo bài kiểm tra**: Thêm bài kiểm tra mới cho lớp
- **Quản lý submissions**: Theo dõi sinh viên nộp bài
- **Trạng thái máy scan**: Hiển thị online/offline status

### � Xuất điểm và báo cáo

- **Xuất CSV**: Xuất bảng điểm với UTF-8 BOM
- **Điểm có trọng số**: Tính điểm tổng kết theo công thức (0.1, 0.2, 0.2, 0.5)
- **Nhiều cách tính**: Chọn trung bình hoặc điểm cao nhất
- **Toast notifications**: Thông báo đẹp thay thế alert cũ
- **Xác nhận xuất**: Dialog xác nhận trước khi xuất

### 🎯 Giao diện người dùng hiện đại

- **Shadcn/UI Components**: Giao diện đẹp, nhất quán
- **Sonner Toast**: Thông báo màu sắc, có thể đóng
- **Responsive Design**: Tương thích mọi thiết bị
- **Dark Theme Ready**: Chuẩn bị sẵn cho chế độ tối
- **Animations**: Hiệu ứng mượt mà, chuyên nghiệp

## � Tài khoản đăng nhập

Hệ thống hỗ trợ đăng ký tài khoản mới qua Firebase Authentication hoặc sử dụng tài khoản demo:

```
Email: admin@quickscore.com
Mật khẩu: admin123
```

## �️ Công nghệ sử dụng

### Frontend Framework

- **React 19** - Framework frontend hiện đại nhất
- **TypeScript** - Type safety và developer experience
- **Vite** - Build tool nhanh với HMR
- **React Router DOM v7** - Routing với file-based structure

### UI/UX Libraries

- **Shadcn/UI** - Component library đẹp, có thể tùy chỉnh
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library hiện đại
- **Sonner** - Toast notification library
- **React Hook Form** - Form handling với validation

### Backend & Database

- **Firebase Firestore** - NoSQL database realtime
- **Firebase Realtime Database** - Dữ liệu scan realtime
- **Firebase Authentication** - Xác thực user an toàn

### Development Tools

- **ESLint** - Code linting với TypeScript rules
- **Prettier** - Code formatting nhất quán
- **Zod** - Schema validation
- **Class Variance Authority** - Variant-based styling

## 📁 Cấu trúc dự án

```
src/
├── components/              # Components tái sử dụng
│   ├── ClassList/          # Component danh sách lớp học
│   ├── StudentList/        # Component chi tiết sinh viên lớp
│   │   ├── ExportGradeDialog.tsx      # Dialog xuất điểm
│   │   ├── StudentManagementSection.tsx # Quản lý sinh viên
│   │   ├── ExamManagementSection.tsx   # Quản lý bài kiểm tra
│   │   ├── ClassSettingsSection.tsx    # Cài đặt lớp
│   │   ├── StudentResultsCard.tsx      # Card kết quả sinh viên
│   │   └── hooks.ts                    # Custom hooks
│   ├── ScoreEntry/         # Components nhập điểm
│   ├── Alert/              # Alert components
│   ├── LoadingSpinner/     # Loading components
│   └── ui/                 # Shadcn UI components
├── pages/                  # Các trang chính
│   ├── Login/             # Đăng nhập
│   ├── Register/          # Đăng ký
│   ├── Dashboard/         # Trang chủ
│   ├── ClassDetail/       # Chi tiết lớp
│   ├── Management/        # Quản lý hệ thống
│   ├── StudentsManagement/ # Quản lý sinh viên
│   ├── ScoreEntry/        # Nhập điểm từ scan
│   └── ChangePassword/    # Đổi mật khẩu
├── services/              # API services
│   └── firestore.ts       # Firebase services
├── types/                 # TypeScript type definitions
├── styles/               # Global styles
├── firebase-config.ts    # Firebase configuration
└── main.tsx             # Entry point với Sonner Toaster
```
