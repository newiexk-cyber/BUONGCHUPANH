"""
ONLINE PHOTO BOOTH - PYTHON DSLR & WEBCAM TETHERING BRIDGE
Lắng nghe tại ws://127.0.0.1:9123 và truyền tải ảnh chụp độ phân giải gốc tới Web Studio
"""

import asyncio
import json
import io
import sys

try:
    import websockets
except ImportError:
    print("[Tether Bridge] Cài đặt websockets nếu muốn chạy bridge: pip install websockets")
    sys.exit(0)

PORT = 9123

async def handler(websocket, path):
    print(f"[Tether Bridge] Client đã kết nối từ {websocket.remote_address}")
    
    # Gửi thông tin thiết bị máy ảnh
    camera_info = {
        "type": "CAMERA_INFO",
        "model": "Sony Alpha 7 IV / DSLR Pro",
        "battery": 88
    }
    await websocket.send(json.dumps(camera_info))
    
    async for message in websocket:
        try:
            data = json.loads(message)
            if data.get("command") == "CAPTURE":
                print("[Tether Bridge] Nhận lệnh chụp từ Web Studio...")
                # Trong môi trường studio thực tế, gọi gphoto2 hoặc Sony SDK để lấy ảnh RAW/JPG
        except Exception as e:
            print("[Tether Bridge] Lỗi xử lý tin nhắn:", e)

async def main():
    print(f"=======================================================")
    print(f"  DSLR TETHERING BRIDGE RUNNING AT ws://127.0.0.1:{PORT}")
    print(f"=======================================================")
    async with websockets.serve(handler, "127.0.0.1", PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Tether Bridge] Đã dừng bridge.")
