# Chính Sách Bảo Mật - Quick Score Entry System

## 📋 Tổng Quan

Hệ thống Quick Score Entry áp dụng chính sách bảo mật nghiêm ngặt để bảo vệ dữ liệu nhạy cảm của sinh viên trong Firestore Database.

## 🔒 Chính Sách Phân Tầng Dữ Liệu

### 1. **Firestore Database (Dữ Liệu Bảo Mật)**

- 🎯 **Mục đích**: Lưu trữ dữ liệu chính thức của hệ thống
- 🛡️ **Bảo vệ**: Dữ liệu nhạy cảm của sinh viên
- 📚 **Collections**:
  - `students` - Thông tin sinh viên (họ tên, MSSV, email)
  - `classes` - Thông tin lớp học
  - `enrollments` - Đăng ký lớp học
  - `exams` - Thông tin bài kiểm tra
  - `submissions` - Điểm số và bài nộp

#### ✅ **Được Phép với Firestore**:

- **GET**: Đọc thông tin sinh viên, lớp học, điểm số
- **UPDATE**: Cập nhật điểm số cho sinh viên đã tồn tại
- **CREATE**: Tạo submissions (điểm) mới cho sinh viên có sẵn

#### 🚫 **KHÔNG Được Phép với Firestore**:

- **CREATE**: Tạo sinh viên mới qua giao diện nhập điểm
- **DELETE**: Xóa thông tin sinh viên
- **UPDATE**: Thay đổi thông tin cá nhân (tên, MSSV, email)

### 2. **Realtime Database (Dữ Liệu Tạm Thời)**

- 🎯 **Mục đích**: Lưu trữ kết quả scan tạm thời
- 🔄 **Tính chất**: Có thể chỉnh sửa, xóa tự do
- 📊 **Dữ liệu**: `exam_results` - Kết quả scan từ máy quét

#### ✅ **Được Phép với Realtime Database**:

- **GET**: Đọc kết quả scan realtime
- **CREATE**: Thêm kết quả scan mới (thủ công/tự động)
- **UPDATE**: Sửa thông tin trong kết quả scan
- **DELETE**: Xóa kết quả scan không hợp lệ

## 🔧 Cài Đặt Bảo Mật trong Code

### 1. **Firebase Functions (`functions/src/index.ts`)**

```typescript
/**
 * CHÍNH SÁCH BẢO MẬT: CHỈ ĐỌC VÀ CẬP NHẬT ĐIỂM
 * - KHÔNG được tạo sinh viên mới trong Firestore
 * - CHỈ được cập nhật điểm cho sinh viên đã có sẵn
 * - Firestore là dữ liệu nhạy cảm, chỉ READ-ONLY cho sinh viên
 */
```

**Tính năng bảo mật**:

- Kiểm tra sinh viên tồn tại trước khi cập nhật điểm
- Validation điểm số (0-10)
- Không cho phép tạo sinh viên mới
- Log chi tiết các thao tác

### 2. **React Frontend (`src/pages/ScoreEntry/index.tsx`)**

```typescript
// =====================================================
// CHÍNH SÁCH BẢO MẬT: CHỈ KIỂM TRA SINH VIÊN ĐÃ TỒN TẠI
// =====================================================
// Firestore chứa dữ liệu nhạy cảm của sinh viên
// KHÔNG được tạo mới sinh viên qua giao diện nhập điểm
// Chỉ cho phép lưu điểm cho sinh viên đã có sẵn
```

**Tính năng bảo mật**:

- Validation đầy đủ trước khi lưu điểm
- Không tự động tạo sinh viên mới
- Thông báo lỗi rõ ràng khi sinh viên không tồn tại
- Chỉ cho phép chỉnh sửa dữ liệu trong Realtime Database

### 3. **MCP Client (`server-mcp/mcp_client.py`)**

```python
# =====================================================
# CHÍNH SÁCH BẢO MẬT: CHỈ ĐỌC VÀ CẬP NHẬT ĐIỂM
# =====================================================
# Firestore chứa dữ liệu nhạy cảm của sinh viên
# CHỈ cho phép: GET thông tin + UPDATE điểm số
# KHÔNG cho phép: Tạo sinh viên mới, xóa dữ liệu
```

**Tools bảo mật**:

- `education.student.get_info`: CHỈ ĐỌC thông tin
- `education.score.update`: CHỈ SỬA ĐIỂM cho sinh viên có sẵn

## 🎯 Workflow Bảo Mật

### 1. **Nhập Điểm Qua Giao Diện Web**

```
Scan Results (Realtime DB) → Validation → Firestore (chỉ sinh viên có sẵn)
                          ↓
                    Lỗi nếu sinh viên không tồn tại
```

### 2. **Cập Nhật Điểm Qua Voice AI**

```
XiaoZhi AI → MCP Client → Firebase Functions → Firestore (validation nghiêm)
                                          ↓
                                    Chỉ cập nhật sinh viên có sẵn
```

## 🛡️ Biện Pháp Bảo Vệ

### 1. **Authentication & Authorization**

- Firebase Functions yêu cầu Bearer Token
- MCP Client sử dụng JWT token từ XiaoZhi AI
- Validation nghiêm ngặt mọi thao tác

### 2. **Data Validation**

- Kiểm tra MSSV tối đa 8 ký tự
- Điểm số trong khoảng 0-10
- Tên sinh viên phải khớp chính xác
- Bài kiểm tra phải tồn tại trong lớp

### 3. **Error Handling**

- Thông báo lỗi chi tiết cho admin
- Không tiết lộ thông tin nhạy cảm
- Log đầy đủ mọi thao tác

## 📝 Hướng Dẫn Sử Dụng An Toàn

### ✅ **Được Phép**:

1. **Tra cứu thông tin sinh viên**: "Cho tôi biết điểm của sinh viên Nguyễn Thanh Duy"
2. **Cập nhật điểm**: "Cập nhật điểm Bài kiểm tra đợt 1 của Nguyễn Thanh Duy thành 9 điểm"
3. **Chỉnh sửa kết quả scan**: Sửa/xóa dữ liệu trong Realtime Database
4. **Thêm điểm thủ công**: Qua giao diện web với sinh viên có sẵn

### 🚫 **Không Được Phép**:

1. **Tạo sinh viên mới** qua giao diện nhập điểm
2. **Xóa thông tin sinh viên** trong Firestore
3. **Thay đổi thông tin cá nhân** (tên, MSSV, email)
4. **Tạo lớp học/bài kiểm tra** qua Voice AI

## 🔍 Monitoring & Logging

### 1. **Firebase Functions Logs**

```bash
firebase functions:log --only xiaozhiAgent
```

### 2. **MCP Client Logs**

```
[INFO] (MCP_Client_Firebase) 🔍 Tra cứu sinh viên: Nguyễn Thanh Duy
[INFO] (MCP_Client_Firebase) ✅ Cập nhật điểm thành công
```

### 3. **Firestore Activity**

- Tất cả thao tác được log trong Firebase Console
- Có thể audit trail đầy đủ

## 📞 Liên Hệ Hỗ Trợ

- **Admin**: Để đăng ký sinh viên mới vào hệ thống
- **Technical**: Để báo cáo lỗi bảo mật hoặc đề xuất cải tiến
- **User Guide**: Xem README.md để hướng dẫn sử dụng chi tiết

---

🔒 **Lưu ý quan trọng**: Chính sách này được thiết kế để bảo vệ dữ liệu sinh viên khỏi việc thay đổi không mong muốn. Mọi thay đổi về chính sách bảo mật cần được phê duyệt và test kỹ lưỡng.
