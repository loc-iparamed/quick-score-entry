# MCP Client cho Xiaozhi ESP32 & Firebase Integration

Đây là MCP (Model Context Protocol) Client được viết bằng Python để tích hợp với hệ thống Xiaozhi ESP32 và Firebase Cloud Functions.

## Tính năng chính

- ✅ Tuân thủ đúng giao thức MCP chuẩn của xiaozhi-esp32  
- ✅ Hỗ trợ định dạng message: `{session_id, type, payload}`
- ✅ Tích hợp Firebase Cloud Functions thông qua HTTP API
- ✅ Tự động kết nối lại khi mất kết nối
- ✅ Đăng ký tools theo chuẩn ESP32 IoT control
- ✅ Xử lý đầy đủ MCP flow: Initialize → Tools/List → Tools/Call

## Cấu hình

Cập nhật các thông số trong file `mcp_client.py`:

```python
# URL của Firebase Cloud Function 
FIREBASE_FUNCTION_URL = "https://your-region-your-project.cloudfunctions.net/yourFunction"

# Secret key để bảo mật (cùng với Firebase Function)
FIREBASE_SECRET_KEY = "your-secret-key-here"

# Endpoint MCP của Xiaozhi server
MCP_ENDPOINT = "wss://api.xiaozhi.me/mcp/?token=your-jwt-token"
```

## Tools đã đăng ký

### 1. `firebase.getStudentInfo`
- Mô tả: Lấy thông tin sinh viên từ Firebase
- Tham số: `{"studentName": "string"}` 
- Ví dụ: `{"studentName": "Nguyễn Văn A"}`

### 2. `firebase.updateStudentScore`
- Mô tả: Cập nhật điểm số sinh viên
- Tham số: `{"studentName": "string", "examName": "string", "newScore": number}`
- Ví dụ: `{"studentName": "Nguyễn Văn A", "examName": "Toán", "newScore": 8.5}`

### 3. `firebase.callFunction`
- Mô tả: Gọi bất kỳ Firebase function nào
- Tham số: `{"functionName": "string", "args": object}`
- Ví dụ: `{"functionName": "customFunction", "args": {"param1": "value1"}}`

### 4. `system.info`
- Mô tả: Lấy thông tin hệ thống Python client
- Tham số: `{}` (không cần tham số)

## Cách chạy

1. Cài đặt dependencies:
```bash
pip install websockets httpx
```

2. Chạy client:
```bash
python mcp_client.py
```

## Giao thức MCP Flow

1. **Kết nối WebSocket** tới Xiaozhi server
2. **Initialize**: Server gửi `initialize` request
3. **Tools List**: Server gọi `tools/list` để lấy danh sách tools
4. **Tools Call**: Server gọi `tools/call` để thực thi tool cụ thể

## Định dạng Message

Theo chuẩn xiaozhi-esp32, mọi MCP message đều có cấu trúc:

```json
{
  "session_id": "123456",
  "type": "mcp", 
  "payload": {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "firebase.getStudentInfo",
      "arguments": {"studentName": "Nguyễn Văn A"}
    },
    "id": 123
  }
}
```

## Firebase Cloud Function

Bạn cần tạo Firebase Cloud Function với format:

```javascript
exports.yourFunction = functions.https.onRequest(async (req, res) => {
  // Kiểm tra Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${YOUR_SECRET_KEY}`) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const {functionName, args} = req.body;
  
  // Xử lý logic theo functionName
  let speech = "";
  switch(functionName) {
    case "getStudentInfo":
      speech = `Thông tin sinh viên ${args.studentName}: ...`;
      break;
    case "updateStudentScore":
      speech = `Đã cập nhật điểm ${args.examName} cho ${args.studentName}: ${args.newScore}`;
      break;
    default:
      speech = "Function không tồn tại";
  }
  
  res.json({speech});
});
```

## Debug và Logging

Client sử dụng Python `logging` module:
- `INFO`: Các sự kiện quan trọng (kết nối, nhận tools/call)
- `DEBUG`: Chi tiết messages (bật bằng cách set level=DEBUG)
- `ERROR`: Lỗi kết nối, parse JSON, v.v.

## Lưu ý quan trọng

- ⚠️ Đảm bảo JWT token trong MCP_ENDPOINT còn hạn
- ⚠️ Firebase Function phải trả về `{speech: "..."}` 
- ⚠️ Secret key phải khớp giữa client và Firebase Function
- ⚠️ Tool names nên theo convention `module.action` (vd: `firebase.getStudentInfo`)

## Troubleshooting

**Lỗi kết nối**: Kiểm tra JWT token và network connectivity
**Tool không được gọi**: Xem log để confirm tool đã được đăng ký
**Firebase lỗi 401**: Kiểm tra FIREBASE_SECRET_KEY
**Response format sai**: Đảm bảo Firebase function trả về `{speech: string}`