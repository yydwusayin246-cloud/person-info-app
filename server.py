#!/usr/bin/env python3
"""
简单的本地 Web 服务器启动脚本
用于测试人员信息管理应用
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """自定义日志格式"""
        if '200' in str(args):
            print(f"✅ {self.address_string()} - {format%args}")
        else:
            print(f"❌ {self.address_string()} - {format%args}")

def start_server():
    """启动本地服务器"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║          👥 人员信息管理系统 - 本地开发服务器            ║
╚══════════════════════════════════════════════════════════════╝

🚀 服务器运行在: {url}
📱 在浏览器中打开上述链接查看应用
💡 按 Ctrl+C 停止服务器
🔄 修改文件后刷新浏览器即可看到更新

        """)

        try:
            # 自动打开浏览器
            try:
                webbrowser.open(url)
                print(f"🌐 已打开浏览器\n")
            except:
                print(f"📝 请手动打开浏览器访问: {url}\n")

            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n⛔ 服务器已停止")
            sys.exit(0)

if __name__ == "__main__":
    start_server()
