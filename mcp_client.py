import asyncio
import json
import websockets
import logging
import platform
import random
import httpx


# --- CẤU HÌNH ---
from config import FIREBASE_CONFIG, XIAOZHI_CONFIG, CLIENT_CONFIG

# Firebase và XiaoZhi configuration
FIREBASE_FUNCTION_URL = FIREBASE_CONFIG["function_url"]
FIREBASE_SECRET_KEY = FIREBASE_CONFIG["secret_key"]
MCP_ENDPOINT = XIAOZHI_CONFIG["mcp_endpoint"]
# -------------------------

# Cấu hình logging
logging.basicConfig(level=logging.INFO,
                    format='[%(levelname)s] (%(name)s) %(message)s')
log = logging.getLogger('MCP_Client_Firebase')

# Tạo một HTTP client bất đồng bộ để tái sử dụng
# Giúp tăng tốc độ gọi API
http_client = httpx.AsyncClient()


class WebSocketMCPClient:
    """
    MCP Client phù hợp với xiaozhi-esp32 protocol.
    Xử lý messages được bọc trong cấu trúc: {session_id, type, payload}
    """

    def __init__(self, endpoint):
        self.endpoint = endpoint
        self._tools = {}  # Dùng dict để lưu các tool đã đăng ký
        self.websocket = None
        self._msg_id_counter = random.randint(1, 1000)
        self.session_id = str(random.randint(100000, 999999))
        self.initialized = False

    def register_tool(self, name, description, input_schema, callback):
        """Đăng ký một tool"""
        if name in self._tools:
            log.warning(f"Tool '{name}' đã được đăng ký, sẽ được ghi đè.")

        self._tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": json.loads(input_schema),
            "callback": callback
        }
        log.info(f"Đã đăng ký tool: {name}")

    async def _send_mcp_message(self, websocket, payload, direct=False):
        """Gửi MCP message theo format phù hợp"""
        if direct:
            # Gửi trực tiếp JSON-RPC (không wrap)
            message = payload
        else:
            # Gửi theo format wrapped
            message = {
                "session_id": self.session_id,
                "type": "mcp",
                "payload": payload
            }
        try:
            await websocket.send(json.dumps(message))
            log.debug(f"Đã gửi: {json.dumps(message, indent=2)}")
        except Exception as e:
            log.error(f"Lỗi khi gửi tin nhắn: {e}")

    def _get_next_id(self):
        """Tạo ID cho request"""
        self._msg_id_counter += 1
        return self._msg_id_counter

    async def _handle_message(self, websocket, raw_message):
        """Xử lý tin nhắn đến từ xiaozhi server"""
        try:
            outer_msg = json.loads(raw_message)
            log.debug(f"Nhận được: {json.dumps(outer_msg, indent=2)}")
        except json.JSONDecodeError:
            log.error(f"Không thể parse JSON: {raw_message}")
            return

        # Xử lý tin nhắn MCP (wrapped format)
        if outer_msg.get("type") == "mcp" and "payload" in outer_msg:
            payload = outer_msg["payload"]
            await self._handle_mcp_payload(websocket, payload)
        # Xử lý tin nhắn JSON-RPC trực tiếp (direct format)
        elif "jsonrpc" in outer_msg and outer_msg.get("jsonrpc") == "2.0":
            log.info(
                f"Nhận được JSON-RPC trực tiếp: {outer_msg.get('method', 'unknown')}")
            await self._handle_mcp_payload(websocket, outer_msg)
        else:
            log.info(f"Nhận được tin nhắn không phải MCP: {outer_msg}")

    async def _handle_mcp_payload(self, websocket, payload):
        """Xử lý JSON-RPC payload"""
        if "method" in payload and "id" in payload:
            method = payload.get("method")
            msg_id = payload.get("id")
            params = payload.get("params", {})

            # 1. PING
            if method == "ping":
                log.info("Nhận được PING, gửi PONG...")
                await self._send_mcp_message(websocket, {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {}
                }, direct=True)

            # 2. INITIALIZE
            elif method == "initialize":
                log.info("Nhận được INITIALIZE, gửi phản hồi...")
                await self._send_mcp_message(websocket, {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {"listChanged": False}},
                        "serverInfo": {
                            "name": CLIENT_CONFIG["name"],
                            "version": CLIENT_CONFIG["version"]
                        }
                    }
                }, direct=True)
                # Gửi initialized notification
                await self._send_mcp_message(websocket, {
                    "jsonrpc": "2.0",
                    "method": "notifications/initialized"
                }, direct=True)
                self.initialized = True

            # 3. TOOLS/LIST
            elif method == "tools/list":
                log.info("Nhận được TOOLS/LIST, gửi danh sách tool...")
                tool_list = [
                    {
                        "name": t["name"],
                        "description": t["description"],
                        "inputSchema": t["inputSchema"]
                    } for t in self._tools.values()
                ]
                await self._send_mcp_message(websocket, {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "tools": tool_list,
                        "nextCursor": ""  # Không phân trang
                    }
                }, direct=True)

            # 4. TOOLS/CALL
            elif method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})
                log.info(
                    f"🎯 XiaoZhi AI gọi tool: '{tool_name}' với args: {tool_args}")

                tool = self._tools.get(tool_name)
                if not tool:
                    log.error(f"❌ Tool không tồn tại: {tool_name}")
                    await self._send_mcp_message(websocket, {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "error": {
                            "code": -32601,
                            "message": f"Unknown tool: {tool_name}"
                        }
                    }, direct=True)
                else:
                    try:
                        log.info(f"⚡ Đang thực thi tool: {tool_name}")
                        # Gọi callback
                        if asyncio.iscoroutinefunction(tool["callback"]):
                            result = await tool["callback"](tool_name, tool_args)
                        else:
                            result = tool["callback"](tool_name, tool_args)

                        log.info(f"✅ Tool thành công: {result[:100]}")

                        # Gửi response thành công
                        await self._send_mcp_message(websocket, {
                            "jsonrpc": "2.0",
                            "id": msg_id,
                            "result": {
                                "content": [
                                    {"type": "text", "text": str(result)}
                                ],
                                "isError": False
                            }
                        }, direct=True)

                    except Exception as e:
                        log.error(
                            f"❌ Lỗi khi thực thi tool '{tool_name}': {e}")
                        await self._send_mcp_message(websocket, {
                            "jsonrpc": "2.0",
                            "id": msg_id,
                            "result": {
                                "content": [
                                    {"type": "text", "text": f"Error: {e}"}
                                ],
                                "isError": True
                            }
                        }, direct=True)

            else:
                log.warning(f"Không nhận ra method: {method}")

    async def connect(self):
        """Kết nối tới MCP Server với tự động kết nối lại"""
        while True:
            try:
                async with websockets.connect(
                    self.endpoint,
                    ping_interval=20,
                    ping_timeout=10
                ) as websocket:
                    self.websocket = websocket
                    log.info(f"Đã kết nối tới MCP Server: {self.endpoint}")

                    # Chờ server gửi initialize request hoặc xử lý messages
                    async for message in websocket:
                        await self._handle_message(websocket, message)

            except websockets.exceptions.ConnectionClosed as e:
                log.warning(f"Kết nối đóng: {e}. Thử lại sau 5s...")
                self.websocket = None
                self.initialized = False
                await asyncio.sleep(5)
            except Exception as e:
                log.error(f"Lỗi WebSocket: {e}. Thử lại sau 5s...")
                self.websocket = None
                self.initialized = False
                await asyncio.sleep(5)


# --- PHẦN MAIN: ĐỊNH NGHĨA CÁC HÀM GỌI FIREBASE ---

async def call_firebase_function(function_name: str, args: dict) -> str:
    """
    Hàm chung để gọi đến Firebase Cloud Function.
    Nó sẽ được gọi bởi các hàm handle_...
    """
    log.info(f"[FIREBASE] Đang gọi hàm '{function_name}' với params: {args}")

    headers = {
        "Authorization": f"Bearer {FIREBASE_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "functionName": function_name,
        "args": args
    }

    try:
        response = await http_client.post(
            FIREBASE_FUNCTION_URL,
            json=payload,
            headers=headers,
            timeout=10.0  # Chờ tối đa 10 giây
        )

        # Ném lỗi nếu request thất bại (4xx, 5xx)
        response.raise_for_status()

        # Parse JSON trả về từ Cloud Function
        response_data = response.json()

        # Trả về câu nói (speech) mà Cloud Function đã xử lý
        return response_data.get("speech", "Lỗi: Firebase không trả về 'speech'.")

    except httpx.HTTPStatusError as e:
        log.error(
            f"Lỗi HTTP khi gọi Firebase: {e.response.status_code} - {e.response.text}")
        return f"Lỗi: Không thể gọi Cloud Function, mã lỗi {e.response.status_code}"
    except Exception as e:
        log.error(f"Lỗi khi gọi Firebase: {e}")
        return f"Lỗi hệ thống phía client Python: {e}"

# --- Các hàm callback cho từng tool ---

# === HÀM XỬ LÝ FIRESTORE (CÓ BẢO VỆ TỪkhóa) ===


async def handle_get_student_info(tool_name: str, args: dict) -> str:
    """
    Xử lý lệnh 'getStudentInfo' bằng cách gọi hàm chung.
    'args' sẽ là: {"studentName": "Trần Thị B"}
    """
    # Gọi Firebase function với tên chính xác từ index.ts
    return await call_firebase_function("getStudentInfo", args)


async def handle_update_student_score(tool_name: str, args: dict) -> str:
    """
    Xử lý lệnh 'updateStudentScore' bằng cách gọi hàm chung.
    'args' sẽ là: {"studentName": "...", "examName": "...", "newScore": 8.5}
    """
    # Gọi Firebase function với tên chính xác từ index.ts
    return await call_firebase_function("updateStudentScore", args)


async def handle_generic_firebase_call(tool_name: str, args: dict) -> str:
    """
    Xử lý gọi Firebase function tổng quát.
    'args' sẽ là: {"functionName": "tên_function", "args": {...}}
    """
    function_name = args.get("functionName")
    function_args = args.get("args", {})

    if not function_name:
        return "Lỗi: Thiếu tham số 'functionName'"

    return await call_firebase_function(function_name, function_args)


def system_info(tool_name: str, params: dict) -> str:
    """Lấy thông tin hệ thống (Hàm này chạy local, không gọi Firebase)."""
    log.info(f"[TOOL {tool_name}] Đã nhận lệnh")

    info = {
        "platform": platform.system(),
        "release": platform.release(),
        "python_version": platform.python_version(),
        "mcp_client": CLIENT_CONFIG["name"],
        "version": CLIENT_CONFIG["version"],
        "project": CLIENT_CONFIG["project"],
        "description": CLIENT_CONFIG["description"]
    }
    # Trả về một chuỗi JSON
    return json.dumps(info, ensure_ascii=False, indent=2)


# === HÀM XỬ LÝ REALTIME DATABASE (CRUD ĐẦY ĐỦ) ===

async def handle_get_scan_results(tool_name: str, args: dict) -> str:
    """Lấy tất cả kết quả scan từ Realtime Database."""
    return await call_firebase_function("getScanResults", {})


async def handle_create_scan_result(tool_name: str, args: dict) -> str:
    """Tạo kết quả scan mới trong Realtime Database."""
    return await call_firebase_function("createScanResult", args)


async def handle_update_scan_result(tool_name: str, args: dict) -> str:
    """Cập nhật kết quả scan trong Realtime Database."""
    return await call_firebase_function("updateScanResult", args)


async def handle_delete_scan_result(tool_name: str, args: dict) -> str:
    """Xóa kết quả scan trong Realtime Database."""
    return await call_firebase_function("deleteScanResult", args)


async def handle_clear_all_scan_results(tool_name: str, args: dict) -> str:
    """Xóa tất cả kết quả scan trong Realtime Database."""
    return await call_firebase_function("clearAllScanResults", {})


async def main():
    """
    Hàm setup() và loop() chính - Quick Score Entry MCP Client
    """
    print("🚀 Quick Score Entry - MCP Client for XiaoZhi AI")
    print("="*60)
    print(f"🔧 Client: {CLIENT_CONFIG['name']} v{CLIENT_CONFIG['version']}")
    print(f"🎯 Project: {CLIENT_CONFIG['project']}")
    print("="*60)

    # 1. Khởi tạo Client
    client = WebSocketMCPClient(MCP_ENDPOINT)

    # 2. Đăng ký các Tool theo chuẩn giáo dục

    # =====================================================
    # CHÍNH SÁCH BẢO MẬT: CHỈ ĐỌC VÀ CẬP NHẬT ĐIỂM
    # =====================================================
    # Firestore chứa dữ liệu nhạy cảm của sinh viên
    # CHỈ cho phép: GET thông tin + UPDATE điểm số
    # KHÔNG cho phép: Tạo sinh viên mới, xóa dữ liệu
    # =====================================================

    # Tool 1: Tra cứu thông tin sinh viên (READ-ONLY)
    client.register_tool(
        "education.student.get_info",
        "🔍 Tra cứu thông tin sinh viên (CHỈ ĐỌC) - Firestore protected. "
        "Có thể lấy danh sách tất cả sinh viên HOẶC thông tin sinh viên cụ thể. "
        "Bắt buộc phải có cụm từ 'trong cơ sở dữ liệu' để truy cập Firestore.",
        '{"type":"object","properties":{"studentName":{"type":"string",'
        '"description":"Toàn bộ câu yêu cầu của user bao gồm cụm từ khóa. '
        'Ví dụ: Hãy cung cấp thông tin sinh viên trong cơ sở dữ liệu '
        'hoặc Nguyễn Thanh Duy trong cơ sở dữ liệu"}},'
        '"required":["studentName"]}',
        handle_get_student_info
    )

    # Tool 2: Cập nhật điểm số sinh viên (CHỈ SỬA ĐIỂM)
    client.register_tool(
        "education.score.update",
        "📝 Cập nhật điểm sinh viên (CHỈ SỬA ĐIỂM) - KHÔNG tạo mới. "
        "Chỉ sửa điểm cho sinh viên đã tồn tại. Bắt buộc có 'trong cơ sở dữ liệu'.",
        '{"type":"object","properties":{"studentName":{"type":"string",'
        '"description":"Tên sinh viên với cụm từ khóa (VD: \'Nguyễn Văn A trong cơ sở dữ liệu\')"},'
        '"examName":{"type":"string",'
        '"description":"Tên bài kiểm tra với cụm từ khóa (VD: \'Bài kiểm tra đợt 1 trong cơ sở dữ liệu\')"},'
        '"newScore":{"type":"number",'
        '"description":"Điểm số mới (0-10, có thể số thập phân)",'
        '"minimum":0,"maximum":10}},'
        '"required":["studentName","examName","newScore"]}',
        handle_update_student_score
    )

    # =====================================================
    # CÁC TOOLS CHO REALTIME DATABASE (CRUD ĐẦY ĐỦ)
    # =====================================================
    # Realtime Database: Cho phép CRUD đầy đủ cho trang ScoreEntry
    # Dữ liệu scan tạm thời, có thể chỉnh sửa tự do
    # =====================================================

    # Tool 3: Lấy tất cả kết quả scan từ Realtime Database
    client.register_tool(
        "scan.results.get_all",
        "📊 Lấy tất cả kết quả scan từ Realtime Database. "
        "Hiển thị dữ liệu scan tạm thời từ trang ScoreEntry.",
        '{"type":"object","properties":{}}',
        handle_get_scan_results
    )

    # Tool 4: Tạo kết quả scan mới trong Realtime Database
    client.register_tool(
        "scan.results.create",
        "➕ Tạo kết quả scan mới trong Realtime Database. "
        "Thêm dữ liệu scan thủ công vào hệ thống.",
        '{"type":"object","properties":{"studentName":{"type":"string",'
        '"description":"Tên đầy đủ sinh viên"},"mssv":{"type":"string",'
        '"description":"Mã số sinh viên"},"score":{"type":"number",'
        '"description":"Điểm số (0-10)","minimum":0,"maximum":10}},'
        '"required":["studentName","mssv","score"]}',
        handle_create_scan_result
    )

    # Tool 5: Cập nhật kết quả scan trong Realtime Database
    client.register_tool(
        "scan.results.update",
        "📝 Cập nhật kết quả scan trong Realtime Database. "
        "Sửa thông tin dữ liệu scan đã có.",
        '{"type":"object","properties":{"id":{"type":"string",'
        '"description":"ID của kết quả scan cần cập nhật"},'
        '"studentName":{"type":"string","description":"Tên sinh viên mới"},'
        '"mssv":{"type":"string","description":"MSSV mới"},'
        '"score":{"type":"number","description":"Điểm mới (0-10)",'
        '"minimum":0,"maximum":10}},"required":["id"]}',
        handle_update_scan_result
    )

    # Tool 6: Xóa kết quả scan trong Realtime Database
    client.register_tool(
        "scan.results.delete",
        "🗑️ Xóa kết quả scan trong Realtime Database. "
        "Xóa một kết quả scan cụ thể theo ID.",
        '{"type":"object","properties":{"id":{"type":"string",'
        '"description":"ID của kết quả scan cần xóa"}},'
        '"required":["id"]}',
        handle_delete_scan_result
    )

    # Tool 7: Xóa tất cả kết quả scan trong Realtime Database
    client.register_tool(
        "scan.results.clear_all",
        "🗑️ Xóa tất cả kết quả scan trong Realtime Database. "
        "Dọn sạch dữ liệu để chuẩn bị batch scan mới.",
        '{"type":"object","properties":{}}',
        handle_clear_all_scan_results
    )

    # Tool 8: Thông tin hệ thống
    client.register_tool(
        "system.get_info",
        "ℹ️ Lấy thông tin hệ thống và trạng thái của MCP client",
        '{"type":"object","properties":{}}',
        system_info
    )

    print(f"✅ Đã đăng ký {len(client._tools)} tools:")
    for tool_name in client._tools.keys():
        print(f"   📌 {tool_name}")

    print("🎯 HƯỚNG DẪN SỬ DỤNG XIAOZHI AI:")
    print("=" * 60)
    print("� FIRESTORE DATABASE (cần cụm từ 'trong cơ sở dữ liệu'):")
    print("1️⃣  'Hãy cung cấp thông tin sinh viên trong cơ sở dữ liệu'")
    print("2️⃣  'Cho tôi biết điểm của Nguyễn Thanh Duy trong cơ sở dữ liệu'")
    print("3️⃣  'Cập nhật điểm Bài kiểm tra đợt 1 của Duy thành 9 trong cơ sở dữ liệu'")
    print("")
    print("🔄 REALTIME DATABASE (CRUD đầy đủ - trang ScoreEntry):")
    print("4️⃣  'Cho tôi xem tất cả kết quả scan'")
    print("5️⃣  'Tạo kết quả scan mới cho Nguyễn Văn A, MSSV 20210001, điểm 8'")
    print("6️⃣  'Cập nhật kết quả scan ID abc123 với điểm 9'")
    print("7️⃣  'Xóa kết quả scan ID abc123'")
    print("8️⃣  'Xóa tất cả kết quả scan'")
    print("")
    print("ℹ️  KHÁC:")
    print("9️⃣  'Kiểm tra thông tin hệ thống'")
    print("=" * 60)

    log.info("🔌 Bắt đầu kết nối tới XiaoZhi AI MCP Server...")

    # 3. Chạy client
    await client.connect()


if __name__ == "__main__":
    # Cài đặt thư viện: pip install websockets httpx
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Đã dừng client.")
    finally:
        # Đóng HTTP client khi chương trình kết thúc
        asyncio.run(http_client.aclose())
