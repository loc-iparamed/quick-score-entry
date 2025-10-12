# Quick Score Entry - Ứng dụng Quản lý Sinh viên

Ứng dụng web hiện đại giúp giảng viên quản lý và theo dõi thông tin sinh viên trong các lớp học.

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

## 🔧 Cấu hình Environment

Tạo file `.env` trong thư mục gốc với các biến sau:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## ✨ Tính năng

- 🔐 **Đăng nhập bảo mật**: Xác thực tài khoản giảng viên
- 👥 **Quản lý sinh viên**: Thêm, sửa, xóa thông tin sinh viên
- 📊 **Thống kê**: Xem báo cáo tổng quan về lớp học
- 🎯 **Nhập điểm**: Ghi điểm nhanh và chính xác

## 🔑 Đăng nhập

- 📚 **Quản lý lớp học**: Hiển thị danh sách các lớp đang giảng dạy- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

````

Tài khoản: admin- 👥 **Chi tiết sinh viên**: Xem thông tin đầy đủ của sinh viên trong từng lớp

Mật khẩu: admin

```- 📊 **Thống kê GPA**: Theo dõi điểm trung bình của sinh viên## React Compiler



## 🛠️ Tech Stack- 🎨 **Giao diện hiện đại**: UI/UX thân thiện với thiết kế responsive



- React 19 + TypeScriptThe React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

- Vite

- React Router DOM## 🚀 Công nghệ sử dụng

- CSS Modules

## Expanding the ESLint configuration

## 📁 Cấu trúc

- **Frontend**: React 19 + TypeScript

````

src/- **Build Tool**: ViteIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

├── components/ # ClassList, StudentList

├── pages/ # Login, Dashboard- **Routing**: React Router DOM v7

├── styles/ # CSS

└── App.tsx # Main app- **Styling**: CSS Modules```js

````

- **Code Quality**: ESLint + Prettierexport default defineConfig([

## ✨ Tính năng

  globalIgnores(['dist']),

- Đăng nhập giảng viên

- Xem danh sách lớp học## 📁 Cấu trúc dự án  {

- Chi tiết sinh viên trong lớp

- Thống kê GPA    files: ['**/*.{ts,tsx}'],

```    extends: [

src/      // Other configs...

├── components/          # Components tái sử dụng

│   ├── ClassList/      # Component danh sách lớp học      // Remove tseslint.configs.recommended and replace with this

│   └── StudentList/    # Component danh sách sinh viên      tseslint.configs.recommendedTypeChecked,

├── pages/              # Các trang chính      // Alternatively, use this for stricter rules

│   ├── Login/          # Trang đăng nhập      tseslint.configs.strictTypeChecked,

│   └── Dashboard/      # Trang dashboard      // Optionally, add this for stylistic rules

├── styles/             # Global styles      tseslint.configs.stylisticTypeChecked,

│   ├── App.css

│   └── index.css      // Other configs...

├── App.tsx             # Component root với routing    ],

└── main.tsx           # Entry point    languageOptions: {

```      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 🛠️ Cài đặt và chạy        tsconfigRootDir: import.meta.dirname,

      },

### Yêu cầu hệ thống      // other options...

- Node.js >= 18.0.0    },

- npm hoặc yarn  },

])

### Cài đặt dependencies```

```bash

npm installYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

````

````js

### Chạy development server// eslint.config.js

```bashimport reactX from 'eslint-plugin-react-x'

npm run devimport reactDom from 'eslint-plugin-react-dom'

````

export default defineConfig([

Ứng dụng sẽ chạy tại: `http://localhost:5173` globalIgnores(['dist']),

{

### Build cho production files: ['**/*.{ts,tsx}'],

````bash extends: [

npm run build      // Other configs...

```      // Enable lint rules for React

      reactX.configs['recommended-typescript'],

### Preview production build      // Enable lint rules for React DOM

```bash      reactDom.configs.recommended,

npm run preview    ],

```    languageOptions: {

      parserOptions: {

## 🔑 Tài khoản đăng nhập        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

```      },

Tài khoản: admin      // other options...

Mật khẩu: admin    },

```  },

])

## 📋 Chức năng chi tiết```


### Trang Đăng nhập
- Form đăng nhập với validation
- Kiểm tra tài khoản/mật khẩu
- Lưu trạng thái đăng nhập trong localStorage

### Dashboard
- **Danh sách lớp học**: Hiển thị các lớp với thông tin cơ bản
  - Tên lớp học
  - Mã môn học
  - Kỳ học
  - Số lượng sinh viên
- **Chi tiết lớp học**: Khi click vào lớp sẽ hiển thị
  - Danh sách sinh viên với thông tin đầy đủ
  - GPA của từng sinh viên (màu sắc theo điểm số)
  - Trạng thái học tập (Đang học/Nghỉ học)
  - Thống kê tổng quan

### Thông tin sinh viên
- Mã sinh viên
- Họ tên
- Email
- Số điện thoại
- Ngành học
- GPA (điểm trung bình)
- Trạng thái học tập

## 🎨 Thiết kế UI

- **Responsive Design**: Hoạt động tốt trên desktop và mobile
- **Modern UI**: Gradient backgrounds, glassmorphism effects
- **Interactive Elements**: Hover effects, animations
- **Color Coding**: GPA được hiển thị với màu sắc trực quan

## 🔧 Scripts có sẵn

```bash
# Development
npm run dev          # Chạy dev server với HMR
npm run build        # Build cho production
npm run preview      # Preview production build
npm run lint         # Chạy ESLint
npm run format       # Format code với Prettier
````

## 🌟 Tính năng sắp tới

- [ ] Kết nối API backend thực tế
- [ ] Thêm/chỉnh sửa thông tin sinh viên
- [ ] Upload và quản lý điểm số
- [ ] Xuất báo cáo PDF
- [ ] Tìm kiếm và lọc sinh viên
- [ ] Dark mode

## 📝 License

Dự án này được phát triển cho mục đích học tập và demo.

## 👨‍💻 Tác giả

Được phát triển như một dự án demo cho hệ thống quản lý sinh viên trường đại học.
