# Quick Score Entry - Hệ thống Quản Lý Sinh Viên & Nhập Điểm

Ứng dụng web hiện đại dành cho giảng viên, cung cấp giải pháp toàn diện để quản lý lớp học, sinh viên và điểm số với tích hợp máy scan tự động thông minh.

## 🔒 Chính Sách Bảo Mật

Hệ thống áp dụng **chính sách bảo mật nghiêm ngặt** để bảo vệ dữ liệu sinh viên:

- **Firestore Database**: Dữ liệu chính thức, CHỈ đọc và cập nhật điểm
- **Realtime Database**: Dữ liệu tạm thời, có thể chỉnh sửa tự do
- **Không tạo sinh viên mới** qua giao diện nhập điểm
- **Voice AI Integration**: Tra cứu danh sách sinh viên và cập nhật điểm với bảo mật từ khóa

📋 **Xem chi tiết**: [SECURITY_POLICY.md](./SECURITY_POLICY.md)

## 🚀 Cài đặt và Chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd quick-score-entry
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Firebase

```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin Firebase của bạn
# Tham khảo Firebase Console để lấy các giá trị
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Truy cập: `http://localhost:5173`

## 🔧 Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc với các biến sau:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

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

## 🔧 Khắc phục Trang Trắng trên Vercel

Các bước đã được thực hiện để khắc phục:

1. **Di chuyển firebase-config**: Từ root folder vào `src/firebase-config.ts`
2. **Cập nhật import paths**: Tất cả các import firebase đã được sửa
3. **Cấu hình Vite**: Thêm `base: './'` và build options
4. **Vercel config**: Cập nhật `vercel.json` với framework detection

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

## � Cài đặt và chạy

### Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **npm** hoặc **yarn**
- **Firebase project** đã cấu hình

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

### Build cho production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## 🔧 Scripts có sẵn

```bash
# Development
npm run dev          # Chạy dev server với HMR
npm run build        # Build cho production
npm run preview      # Preview production build
npm run lint         # Chạy ESLint
npm run format       # Format code với Prettier
```

## 📋 Chức năng chi tiết

### � Dashboard - Trang chủ

- **Thống kê tổng quan**: Hiển thị tổng số lớp học và sinh viên
- **Danh sách lớp**: Grid view với thông tin lớp học
- **Navigation**: Điều hướng đến các trang quản lý
- **Profile menu**: Đổi mật khẩu, đăng xuất

### 👨‍🎓 Chi tiết lớp học (/class/:classId)

- **3 tab chính**:
  - **Sinh viên**: Quản lý sinh viên trong lớp
  - **Bài kiểm tra**: Xem danh sách exam và submissions
  - **Cài đặt**: Đổi tên lớp, xóa lớp
- **Thống kê**: Số sinh viên, số bài kiểm tra hoàn thành
- **Xuất điểm**: Export CSV với điểm tổng kết có trọng số
- **Quản lý enrollment**: Thêm/bỏ sinh viên khỏi lớp

### 📊 Nhập điểm (/score-entry)

- **Chọn lớp và bài kiểm tra**: Dropdown selector
- **Kết nối máy scan**: Hiển thị trạng thái online/offline
- **Bảng kết quả scan**: Realtime data từ Python scanner
- **Chỉnh sửa kết quả**: Sửa tên, MSSV, điểm số
- **Xem ảnh bài thi**: Preview modal cho ảnh scan
- **Nhập thủ công**: Thêm điểm bằng tay
- **Lưu vào Firestore**: Batch save tất cả điểm

### 🎯 Quản lý sinh viên (/students)

- **Bảng danh sách**: Tất cả sinh viên với thông tin đầy đủ
- **CRUD operations**: Tạo, sửa, xóa sinh viên
- **Form validation**: Kiểm tra MSSV, email, số điện thoại
- **Tìm kiếm**: Search theo tên hoặc MSSV

### ⚙️ Quản lý hệ thống (/management)

- **Quản lý lớp học**: CRUD operations cho classes
- **Phân quyền giảng viên**: Assign teacher cho từng lớp
- **Bulk operations**: Thao tác hàng loạt

## 🔧 Tích hợp máy scan Python

### Cách hoạt động

1. **Python scanner** scan bài thi và gửi kết quả lên Firebase Realtime DB
2. **React app** lắng nghe realtime updates
3. **Giảng viên** review và chỉnh sửa kết quả nếu cần
4. **Lưu điểm** vào Firestore với thông tin student và exam

### Định dạng dữ liệu scan

```json
{
  "exam_results": {
    "result_id": {
      "ho_ten": "Nguyễn Văn A",
      "mssv": "20210001",
      "diem": 8.5,
      "create_at": "2024-01-15T10:30:00Z",
      "image_data": "base64_image_string"
    }
  }
}
```

## 🎨 Thiết kế UI/UX

### Design System

- **Shadcn/UI**: Component library với design tokens nhất quán
- **Color Palette**: Blue/Indigo gradient chính, accent colors cho status
- **Typography**: Inter font với hierarchy rõ ràng
- **Spacing**: 4px grid system của Tailwind

### Responsive Design

- **Mobile-first**: Hoạt động tốt trên điện thoại
- **Tablet optimization**: Layout tối ưu cho tablet
- **Desktop enhancement**: Tận dụng không gian màn hình lớn

### Accessibility

- **Keyboard navigation**: Tất cả tương tác có thể dùng bàn phím
- **Screen reader**: ARIA labels và semantic HTML
- **Color contrast**: Đạt chuẩn WCAG AA

## 🌟 Tính năng nâng cao

### Xuất điểm thông minh

- **Công thức có trọng số**: 0.1 × Đợt1 + 0.2 × Đợt2 + 0.2 × GiữaKỳ + 0.5 × CuốiKỳ
- **Xử lý trùng lặp**: Chọn trung bình hoặc điểm cao nhất
- **UTF-8 BOM**: Hỗ trợ tiếng Việt trong Excel
- **Validation**: Kiểm tra dữ liệu trước khi xuất

### Toast Notifications

- **Sonner integration**: Thay thế alert() cũ
- **Rich colors**: Success (green), Error (red), Info (blue)
- **Close button**: Người dùng có thể đóng thông báo
- **Position**: Top-right corner, không che giao diện

### Component Architecture

- **Separation of concerns**: Mỗi component có trách nhiệm rõ ràng
- **Custom hooks**: Logic tái sử dụng được
- **TypeScript strict**: Type safety ở mọi level
- **Props interface**: Giao tiếp component rõ ràng

## 🚀 Triển khai (Deployment)

### Vercel (Recommended)

1. **Connect repository**: Import từ GitHub
2. **Environment variables**: Thêm Firebase config
3. **Build settings**: Framework = Vite, Build = `npm run build`
4. **Domain**: Custom domain nếu cần

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🌟 Roadmap tương lai

### Version 2.0

- [ ] **Dark mode**: Chế độ tối hoàn chỉnh
- [ ] **PDF export**: Xuất báo cáo PDF với charts
- [ ] **Email notifications**: Gửi email thông báo điểm
- [ ] **Mobile app**: React Native companion app

### Version 2.1

- [ ] **Advanced analytics**: Dashboard thống kê nâng cao
- [ ] **Bulk import**: Import sinh viên từ Excel/CSV
- [ ] **Grade curves**: Điều chỉnh điểm theo đường cong
- [ ] **Attendance tracking**: Theo dõi điểm danh

### Version 2.5

- [ ] **Multi-language**: Hỗ trợ tiếng Anh
- [ ] **Role-based access**: Phân quyền chi tiết
- [ ] **API documentation**: REST API cho integration
- [ ] **Webhook support**: Tích hợp với hệ thống khác

## 📞 Hỗ trợ & Đóng góp

### Báo lỗi (Bug Reports)

- Sử dụng GitHub Issues
- Mô tả chi tiết bước tái hiện
- Kèm screenshot nếu có

### Đóng góp code (Contributing)

1. Fork repository
2. Tạo feature branch
3. Commit với message rõ ràng
4. Tạo Pull Request

### Liên hệ

- GitHub: [@loc-iparamed](https://github.com/loc-iparamed)
- Email: support@quickscore.com

## 📝 License

Dự án này được phát triển cho mục đích giáo dục và demo.

**MIT License** - Sử dụng tự do cho mục đích học tập và phát triển.

## 👨‍💻 Tác giả

Được phát triển bởi đội ngũ phát triển tại **Quick Score Team** như một dự án demo hoàn chỉnh cho hệ thống quản lý sinh viên và điểm số trường đại học hiện đại.
